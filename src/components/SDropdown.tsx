import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { cn } from '../lib/utils';

export interface SDropdownProps {
  label?: string;
  labelClasses?: string;
  inputClasses?: string;
  searchPlaceholder?: string;
  placeholder?: string;
  showSearch?: boolean;
  data?: Array<{ [key: string]: string }>;
  labelField?: string;
  valueField?: string;
  onSelect?: (value: string) => void;
  [key: string]: any;
}

const SDropdown = ({
  label,
  labelClasses,
  searchPlaceholder,
  placeholder,
  showSearch,
  data = [],
  labelField = 'label',
  valueField = 'value',
  value,
  onSelect,
  ...rests
}: SDropdownProps) => {
  const [isFocus, setIsFocus] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text className={cn('text-base mb-2', labelClasses)}>{label}</Text>
      )}
      <Dropdown
        style={[
          styles.dropdown,
          isFocus && { borderColor: '	border-color: rgb(203 213 225)' },
        ]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        search={showSearch}
        maxHeight={300}
        labelField={labelField}
        valueField={valueField}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder || 'Tìm kiếm...'}
        value={value}
        containerStyle={styles.containerStyle}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        onChange={(item: any) => {
          onSelect?.(item?.value);
          setIsFocus(false);
        }}
        {...rests}
      />
    </View>
  );
};

export default SDropdown;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  dropdown: {
    height: 44,
    borderColor: 'border-color: rgb(203 213 225)',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 14,
  },

  icon: {
    marginRight: 5,
  },
  containerStyle: {
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 7,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#999999',
  },
  selectedTextStyle: {
    fontSize: 14,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
