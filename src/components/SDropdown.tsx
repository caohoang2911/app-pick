import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { cn } from '@/lib/utils';
import { CheckCircleFill, CloseLine } from '../core/svgs';
import ArrowDown from '../core/svgs/ArrowDown';

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
  allowClear?: boolean;
  onSelect?: (value: string) => void;
  onClear?: () => void;
  [key: string]: any;
}

const SDropdown = ({
  label,
  labelClasses,
  searchPlaceholder,
  placeholder,
  showSearch,
  data = [],
  labelField = 'name',
  valueField = 'id',
  value,
  allowClear,
  onSelect,
  onClear,
  disabled,
  ...rests
}: SDropdownProps) => {
  const [isFocus, setIsFocus] = useState(false);
  const ref = useRef<any>(null);

  const renderItem = (item: any) => {
    return (
      <TouchableOpacity 
        style={[styles.item, item.disabled && { opacity: 0.5 }]} onPress={() => {
        if(item.disabled) return;
        onSelect?.(item?.[valueField]);
        setIsFocus(false);
        ref.current?.close();
      }}>
        <Text>{item[labelField]}
        </Text>{ value === item?.[valueField] && <CheckCircleFill width={20} height={20} color="green" />}
      </TouchableOpacity>
    );
  };

  return (
    <View className={cn('flex flex-col gap-1.5')} style={styles.container}>
      {label && <Text className={cn('text-base', labelClasses)}>{label}</Text>}
      <Dropdown
        ref={ref}
        style={[
          styles.dropdown,
          isFocus && { borderColor: '	border-color: rgb(203 213 225)' },
          disabled && { backgroundColor: 'rgb(243 244 246)' }
        ]}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        iconStyle={styles.iconStyle}
        data={data}
        search={showSearch}
        maxHeight={500}
        labelField={labelField}
        valueField={valueField}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder || 'Tìm kiếm...'}
        value={value}
        containerStyle={styles.containerStyle}
        onFocus={() => setIsFocus(true)}
        selectedTextProps={{ numberOfLines: 1, ellipsizeMode: 'tail' }}
        renderRightIcon={() => 
          <View className='flex items-center justify-center gap-1 flex-row'>
            {allowClear && value && <Pressable className='bg-gray-50 rounded-full p-1' onPress={() => {
              setIsFocus(false);
              onClear?.();
            }}>
              <CloseLine width={18} height={18} color="#999999" />
            </Pressable>
            }
            <ArrowDown width={20} height={20} color="#999999"  />
          </View>
        }
        renderItem={(item: any) => renderItem(item)}
        onBlur={() => setIsFocus(false)}
        onChange={(item: any) => {
          onSelect?.(item?.[valueField]);
          setIsFocus(false);
        }}
        disable={disabled}
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
    paddingHorizontal: 10,
    // paddingLeft: 10,
  },

  icon: {
    marginRight: 5,
  },
  containerStyle: {
    borderRadius: 5,
    overflow: 'hidden',
    borderColor: '#ddd',
    borderWidth: 1,
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
  item: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
