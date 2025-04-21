import { debounce } from 'lodash';
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSuggestStoreEmployeesByKeyword } from '~/src/api/app-pick/use-suggest-store-employees-by-keyword';
import { useKeyboardVisible } from '~/src/core/hooks/useKeyboardVisible';
import { CheckCircleFill } from '~/src/core/svgs';
import SearchLine from '~/src/core/svgs/SearchLine';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import Empty from './Empty';

type EmployeeType = Option & { username: string }

// Tách thành component riêng để tránh re-render không cần thiết
const EmployeeItem = memo(({ 
  employee, 
  selectedId, 
  onSelect 
}: { 
  employee: EmployeeType, 
  selectedId: string, 
  onSelect: (store: EmployeeType) => void 
}) => {
  const isSelected = selectedId === String(employee.id);
  
  const handlePress = useCallback(() => {
    if (isSelected) return;
    onSelect(employee);
  }, [employee, isSelected, onSelect]);
  
  return (
    <TouchableOpacity 
      disabled={isSelected}
      onPress={handlePress}
    >
      <View className="p-4 border-b flex-row items-center border-gray-200">
        <View className="flex flex-row items-center gap-1">
          {isSelected && <CheckCircleFill width={15} height={15} color={"green"} />}
          <Text className="text-base font-semibold">{employee.username}</Text>
        </View>
        <Text className="text-base text-gray-600">{` - ${employee.name}`}</Text>
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
      }
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

// Memoize các component hiển thị trạng thái loading và empty
const LoadingIndicator = memo(() => (
  <View className="text-center py-3">
    <ActivityIndicator className="text-gray-300" />
  </View>
));

type Props = {
  onSelect: (store: EmployeeType) => void;
  selectedId: string;
};

const EmployeeSelection = forwardRef<any, Props>(
  ({ onSelect, selectedId }, ref) => {
    const [visible, setVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const actionRef = useRef<any>();
    const searchBarRef = useRef<any>(null);

    const { data, refetch, isFetching, isPending } = useSuggestStoreEmployeesByKeyword(searchQuery);
    const employees = data?.data || [];
    
    const isKeyboardVisible = useKeyboardVisible();

    useEffect(() => {
      if (visible) {
        refetch();
      }
    }, [visible, searchQuery]);

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

    const handleSelect = useCallback((store: EmployeeType) => {
      setVisible(false);
      onSelect?.(store);
    }, [onSelect]);

    const handleSearch = useCallback((text: string) => {
      setSearchQuery(text);
    }, []);

    // Memoize list rendering
    const renderItem = useCallback(({ item }: { item: EmployeeType }) => {
      return (
        <EmployeeItem 
          employee={item} 
          selectedId={selectedId} 
          onSelect={handleSelect} 
        />
      );
    }, [selectedId, handleSelect, isFetching, isPending]);

    const keyExtractor = useCallback((item: EmployeeType) => item.id.toString(), []);

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
        title="Chọn nhân viên"
        ref={actionRef}
        maintainPositionOnKeyboard={false}
        snapPoints={[isKeyboardVisible ? 650 : 400, "80%"]}
        onClose={handleClose}
        keyboardBehavior="extend"
      >
        <SearchBar 
              ref={searchBarRef}
              onSearch={handleSearch} 
          />
        {isFetching || isPending ? <LoadingIndicator /> : (
        
        <FlatList
          data={employees}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          ListEmptyComponent={ListEmptyComponent}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(data, index) => ({
            length: 100,
            offset: 100 * index,
            index
          })}
            scrollEnabled={false}
          />
      )}
      </SBottomSheet>
    );
  }
);

export default React.memo(EmployeeSelection);
