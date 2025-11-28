import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { debounce } from 'lodash';
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { FlatList, Linking, Text, TouchableOpacity, View } from 'react-native';
import { useRequestAssignMeToStore } from '~/src/api/app-pick/use-request-assign-me-to-store';
import { useKeyboardVisible } from '~/src/core/hooks/useKeyboardVisible';
import { useAuth } from '~/src/core/store/auth';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { CheckCircleFill } from '~/src/core/svgs';
import SearchLine from '~/src/core/svgs/SearchLine';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import Empty from './Empty';
import { showMessage } from 'react-native-flash-message';

type StoreType = Option & { address: string, tenant: string };

// Constants for role checking
const ADMIN_ROLES = ['STORE_MANAGER', 'ADMIN'] as const;
const TELEGRAM_LINK = 'https://t.me/+3BgB-1UkLUUyMWU1';

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
          {isSelected && <CheckCircleFill width={15} height={15} color="green" />}
          <Text className="text-lg font-semibold">{store.name}</Text>
        </View>
        <Text className="text-sm text-gray-600">{store.address}</Text>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.store.id === nextProps.store.id &&
    prevProps.store.name === nextProps.store.name &&
    prevProps.store.address === nextProps.store.address &&
    prevProps.selectedId === nextProps.selectedId &&
    prevProps.onSelect === nextProps.onSelect
  );
});

StoreItem.displayName = 'StoreItem';

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
    
    // Debounce search - use useMemo to ensure stable reference
    const debouncedSearch = useMemo(
      () => debounce((text: string) => {
        onSearch(text);
      }, 300),
      [onSearch]
    );
    
    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedSearch.cancel();
      };
    }, [debouncedSearch]);
    
    const handleChangeText = useCallback((value: string) => {
      setSearchText(value);
      debouncedSearch(value);
    }, [debouncedSearch]);
    
    const handleClear = useCallback(() => {
      setSearchText('');
      debouncedSearch.cancel();
      onSearch('');
    }, [onSearch, debouncedSearch]);
    
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

SearchBar.displayName = 'SearchBar';

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
    const { stores } = useConfig.use.config() || {};
    
    // Memoize success callback to prevent recreation on every render
    const onSuccessCallback = useCallback(() => {
      setVisible(false);
      showMessage({
        message: '',
        type: 'success',
        duration: 10000,
        renderCustomContent: (_) => (
          <Text> 
            <Text className='mr-1 text-white'>Yêu cầu cấp quyền thành công, vui lòng đăng nhập lại sau vài phút. Vui lòng tham gia nhóm để cập nhật thông báo</Text> 
            <Text className='underline text-blue-500' onPress={() => Linking.openURL(TELEGRAM_LINK)}> {TELEGRAM_LINK}</Text>
          </Text>
        )
      });
    }, []);
    
    const { mutate: requestAssignMeToStore } = useRequestAssignMeToStore(newbie, onSuccessCallback);
    
    const userInfo = useAuth.use.userInfo();

    // Memoize extracted values to prevent unnecessary re-renders
    const userCode = useMemo(() => userInfo?.username, [userInfo?.username]);
    const role = useMemo(() => userInfo?.role, [userInfo?.role]);
    const userTenant = useMemo(() => userInfo?.tenant?.toString(), [userInfo?.tenant]);
    
    const isKeyboardVisible = useKeyboardVisible();

    // Memoize tenant-filtered stores separately to avoid re-filtering on search changes
    const tenantFilteredStores = useMemo(() => {
      if (!stores || !userTenant) return [];
      
      return stores.filter((store: StoreType) => store.tenant === userTenant);
    }, [stores, userTenant]);

    // Memoize the filtered and sorted stores
    const filteredStores = useMemo(() => {
      if (!tenantFilteredStores.length) return [];
      
      // First filter by search query
      const searchFiltered = searchQuery
        ? tenantFilteredStores.filter((store: StoreType) => {
            const query = stringUtils.removeAccents(searchQuery.toLowerCase());
            const storeName = stringUtils.removeAccents(store.name?.toLowerCase() || '');
            const storeAddress = stringUtils.removeAccents(store.address?.toLowerCase() || '');
            
            return storeName.includes(query) || storeAddress.includes(query);
          })
        : tenantFilteredStores;
      
      // Then sort with selected item first
      return searchFiltered.slice().sort((a: StoreType, b: StoreType) => {
        if (String(a.id) === selectedId) return -1;
        if (String(b.id) === selectedId) return 1;
        return 0;
      });
    }, [tenantFilteredStores, searchQuery, selectedId]);

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
      if (role && ADMIN_ROLES.includes(role as any)) {
        setVisible(false);
        onSelect?.(store);
        return;
      }
      showAlert({
        title: 'Yêu cầu cấp quyền siêu thị',
        message: `Bạn có muốn yêu cầu cấp quyền siêu thị ${store.name} không?`,
        onConfirm: () => {
          setLoading(true);
          requestAssignMeToStore({
            storeCode: store.id.toString(),
            employeeCode: code || userCode || ''
          });
          hideAlert();
        },
      });
    }, [onSelect, code, userCode, role, requestAssignMeToStore]);

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
        snapPoints={[isKeyboardVisible ? 600 : 500, "80%"]}
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
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      </SBottomSheet>
    );
  }
);

export default React.memo(StoreSelection);
