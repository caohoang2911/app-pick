import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState, useCallback, memo } from 'react';
import { Text, TouchableOpacity, View, FlatList } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import Empty from './Empty';
import SearchLine from '~/src/core/svgs/SearchLine';
import { CheckCircleFill } from '~/src/core/svgs';
import { useKeyboardVisible } from '~/src/core/hooks/useKeyboardVisible';
import { debounce } from 'lodash';

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
  const isSelected = selectedId === store.id;
  
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
const SearchBar = memo(({ 
  onSearch 
}: { 
  onSearch: (text: string) => void 
}) => {
  const [searchText, setSearchText] = useState('');
  
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
});

type Props = {
  onSelect: (store: StoreType) => void;
  selectedId: string;
};

const StoreSelection = forwardRef<any, Props>(
  ({ onSelect, selectedId }, ref) => {
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const actionRef = useRef<any>();
    const { stores } = useConfig.use.config();

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
      setVisible(false);
      onSelect?.(store);
    }, [onSelect]);

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

    const keyExtractor = useCallback((item: StoreType) => item.id, []);

    const ListEmptyComponent = useCallback(() => <Empty />, []);

    return (
      <SBottomSheet
        visible={visible}
        title="Chọn cửa hàng"
        ref={actionRef}
        snapPoints={[400, "80%"]}
        onClose={handleClose}
        keyboardBehavior="extend"
      >
        <SearchBar onSearch={handleSearch} />
        
        <FlatList
          data={filteredStores}
          renderItem={renderItem}
          keyExtractor={(item: StoreType, index: number) => keyExtractor(item)}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={ListEmptyComponent}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(data, index) => ({
            length: 80, // Ước tính chiều cao mỗi item
            offset: 80 * index,
            index
          })}
          scrollEnabled={false}
        />
      </SBottomSheet>
    );
  }
);

export default React.memo(StoreSelection);
