import { debounce } from 'lodash';
import React, { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef, useState, useEffect } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { CheckCircleFill } from '~/src/core/svgs';
import SearchLine from '~/src/core/svgs/SearchLine';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import Empty from './Empty';
import { useKeyboardVisible } from '~/src/core/hooks/useKeyboardVisible';
import { useRequestAssignMeToStore } from '~/src/api/app-pick/use-request-assign-me-to-store';
import { setLoading } from '~/src/core/store/loading';
import { useAuth } from '~/src/core/store/auth';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { showMessage } from 'react-native-flash-message';

type StoreType = Option & { address: string };

// Tách thành component riêng để tránh re-render không cần thiết
const StoreItem = memo(({ 
  store, 
  selectedId, 
  onSelect 
}: { 
  store: StoreType, 
  selectedId: string, 
  onSelect: (store: StoreType) => void 
}) => {
  const isSelected = selectedId === String(store.id);
  
  const handlePress = useCallback(() => {
    if (isSelected) return;
    onSelect(store);
  }, [store, isSelected, onSelect]);
  
  return (
    <TouchableOpacity 
      disabled={isSelected}
      onPress={handlePress}
    >
      <View className="p-4 border-b border-gray-200">
        <View className="flex flex-row items-center gap-1">
          {isSelected && <CheckCircleFill width={15} height={15} color={"green"} />}
          <Text className="text-lg font-semibold">{store.name}</Text>
        </View>
        <Text className="text-sm text-gray-600">{store.address}</Text>
      </View>
    </TouchableOpacity>
  );
});

// Tách SearchBar thành component riêng
const SearchBar = memo(
  forwardRef<any, { 
    onSearch: (text: string) => void 
  }>(({ 
    onSearch 
  }, ref) => {
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef<any>(null);
    
    // Expose focus method
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }), []);
    
    // Debounce search để tránh filter quá nhiều lần
    const debouncedSearch = useRef(
      debounce((text: string) => {
        onSearch(text);
      }, 300)
    ).current;
    
    const handleChangeText = useCallback((value: string) => {
      setSearchText(value);
      debouncedSearch(value);
    }, [debouncedSearch]);
    
    const handleClear = useCallback(() => {
      setSearchText('');
      onSearch('');
    }, [onSearch]);
    
    return (
      <View className="px-4 pt-3">
        <Input
          ref={inputRef}
          className="flex-grow"
          placeholder="Tìm kiếm"
          prefix={<SearchLine width={20} height={20} />}
          onChangeText={handleChangeText}
          value={searchText}
          allowClear
          onClear={handleClear}
        />
      </View>
    );
  })
);

type Props = {
  onSelect: (store: StoreType) => void;
  selectedId: string;
  code?: string | null;
  newbie?: boolean;
};

const StoreSelection = forwardRef<any, Props>(
  ({ onSelect, selectedId, code, newbie }, ref) => {
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const actionRef = useRef<any>();
    const searchBarRef = useRef<any>(null);
    const { stores } = useConfig.use.config();
    const { mutate: requestAssignMeToStore } = useRequestAssignMeToStore(newbie, () => {
      setVisible(false);
    });
    
    const userInfo = useAuth.use.userInfo();

    const { username: userCode, role } = userInfo || {};
    
    const isKeyboardVisible = useKeyboardVisible();

    // Memoize the filtered stores
    const filteredStores = useMemo(() => {
      if (!stores) return [];
      
      return stores
        .slice() // Create a copy to avoid mutating original array
        .sort((a: any, b: any) => {
          if (a.id === selectedId) return -1;
          if (b.id === selectedId) return 1;
          return 0;
        })
        .filter((store: StoreType) => {
          if (!searchQuery) return true;
          
          const query = stringUtils.removeAccents(searchQuery.toLowerCase());
          const storeName = stringUtils.removeAccents(store.name?.toLowerCase() || '');
          const storeAddress = stringUtils.removeAccents(store.address?.toLowerCase() || '');
          
          return storeName.includes(query) || storeAddress.includes(query);
        });
    }, [stores, searchQuery, selectedId]);

    // Memoize the imperative handle
    useImperativeHandle(
      ref,
      () => ({
        present: () => {
          actionRef.current?.present();
          setVisible(true);
        },
        close: () => {
          actionRef.current?.close();
          setVisible(false);
        },
      }),
      []
    );

    // Memoize event handlers
    const handleClose = useCallback(() => {
      setVisible(false);
    }, []);

    const handleSelect = useCallback((store: StoreType) => {
      if(role === 'STORE_MANAGER') {
        setVisible(false);
        onSelect?.(store);
        return;
      }
      showAlert({
        title: 'Yêu cầu cấp quyền siêu thị',
        message: `Bạn có muốn yêu cầu cấp quyền siêu thị ${store.name} không?`,
        onConfirm: () => {
          setLoading(true)
          requestAssignMeToStore({
            storeCode: store.id.toString(),
            employeeCode: code || userCode || ''
          })

          hideAlert()
        },
      })
    }, [onSelect, code, userCode]);

    const handleSearch = useCallback((text: string) => {
      setSearchQuery(text);
    }, []);

    // Memoize list rendering
    const renderItem = useCallback(({ item }: { item: StoreType }) => (
      <StoreItem 
        store={item} 
        selectedId={selectedId} 
        onSelect={handleSelect} 
      />
    ), [selectedId, handleSelect]);

    const keyExtractor = useCallback((item: StoreType) => item.id.toString(), []);

    const ListEmptyComponent = useCallback(() => <Empty />, []);

    // Focus search input when bottom sheet becomes visible
    useEffect(() => {
      if (visible) {
        // Add a small delay to ensure the bottom sheet is fully presented
        const timer = setTimeout(() => {
          searchBarRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
      }
    }, [visible]);


    return (
      <SBottomSheet
        visible={visible}
        title="Chọn cửa hàng"
        ref={actionRef}
        maintainPositionOnKeyboard={false}
        snapPoints={[isKeyboardVisible ? 600 : 400, "80%"]}
        onClose={handleClose}
        keyboardBehavior="extend"
      >
        <SearchBar 
          ref={searchBarRef}
          onSearch={handleSearch} 
        />
      
        <FlatList
          data={filteredStores}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          ListEmptyComponent={ListEmptyComponent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={false}
        />
      </SBottomSheet>
    );
  }
);

export default React.memo(StoreSelection);
