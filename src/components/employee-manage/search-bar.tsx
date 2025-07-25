import React, { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { colors } from '~/src/ui/colors';
import { Input } from '../Input';

interface SearchBarProps {
  onSearch: (text: string) => void;
  placeholder?: string;
}

const SearchBar = memo(({ 
  onSearch, 
  placeholder = "Nhập từ khóa để tìm NV"
}: SearchBarProps) => {
  const [searchText, setSearchText] = useState('');

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    onSearch(text);
  }, [onSearch]);

  return (
    <View className="px-4 py-3 bg-white border-b border-gray-100">
      <Input
        className="bg-gray-50"
        inputClasses="bg-gray-50 border-0 text-base"
        placeholder={placeholder}
        value={searchText}
        onChangeText={handleSearch}
        prefix={<AntDesign name="search1" size={20} color={colors.gray[500]} />}
        allowClear={true}
        onClear={() => handleSearch('')}
      />
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar; 