import { AntDesign } from '@expo/vector-icons';
import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  ActivityIndicator
} from 'react-native';

interface Item {
  id: string | number;
  name: string;
  [key: string]: any;
}

interface Props {
  items: Item[];
  onSelect: (item: Item) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  itemStyle?: ViewStyle;
  itemTextStyle?: TextStyle;
  style?: ViewStyle;
  selectedValue?: Item | null;
  noResultsText?: string;
  autoFocus?: boolean;
  showDropdownOnEmptySearch?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  value?: string;
  focusable?: boolean;
  onDropdownOpen?: () => void;
  onDropdownClose?: () => void;
  right?: React.ReactNode;
  isLoading?: boolean;
  allowSearch?: boolean;
  onChangeText?: (text: string) => void;
  renderItem?: (item: Item) => React.ReactNode | null;
  maxDropdownHeight?: number;
}

export interface SearchableDropdownRef {
  focus: () => void;
  blur: () => void;
  openDropdown: () => void;
  closeDropdown: () => void;
}

const SearchableDropdown = forwardRef<SearchableDropdownRef, Props>(({
  items,
  onSelect,
  placeholder = 'Tìm kiếm...',
  containerStyle,
  inputStyle,
  itemStyle,
  itemTextStyle,
  value,
  selectedValue,
  noResultsText = 'Không tìm thấy kết quả',
  autoFocus = false,
  onFocus,
  onBlur,
  focusable = true,
  onDropdownOpen,
  onDropdownClose,
  right,
  isLoading = false,
  onChangeText,
  renderItem,
  allowSearch = false,
  maxDropdownHeight = 300,
  showDropdownOnEmptySearch = false,
}, ref) => {
  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const containerRef = useRef<View>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (focusable && inputRef.current) {
        inputRef.current.focus();
      }
    },
    blur: () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    openDropdown: () => {
      setIsDropdownOpen(true);
    },
    closeDropdown: () => {
      setIsDropdownOpen(false);
    }
  }));

  useEffect(() => {
    if (autoFocus && focusable && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus, focusable]);

  useEffect(() => {
    if (selectedValue) {
      setSearchText(selectedValue.name);
    } else if (value) { 
      setSearchText(value);
    }
  }, [selectedValue, value]);

  useEffect(() => {
    if (searchText && allowSearch) {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchText, items]);

  useEffect(() => {
    if (isDropdownOpen) {
      onDropdownOpen?.();
    } else {
      onDropdownClose?.();
    }
  }, [isDropdownOpen, onDropdownOpen, onDropdownClose]);

  const handleSelect = (item: Item) => {
    onSelect(item);
    setSearchText(item.name);
    setIsDropdownOpen(false);
    inputRef.current?.blur();
  };

  const handleOutsideClick = () => {
    setIsDropdownOpen(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    if (focusable) {
      if (searchText.length > 0 || showDropdownOnEmptySearch) {
        setIsDropdownOpen(true);
      }
      onFocus?.();
    } else {
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    onBlur?.();
  };

  const handleClearText = () => {
    setSearchText('');
    onChangeText?.('');
    inputRef.current?.focus();
    
    if (showDropdownOnEmptySearch) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
    
    setFilteredItems(items);
  };

  return (
    <View style={[styles.outerContainer, containerStyle]}>

      {isDropdownOpen && (
        <Pressable 
          style={[styles.overlay]}
          onPress={handleOutsideClick}
        />
      )}
      <View style={styles.rowContainer}>
        <View style={styles.inputWrapper} ref={containerRef}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                if (text.length > 0 || showDropdownOnEmptySearch) {
                  setIsDropdownOpen(true);
                } else {
                  setIsDropdownOpen(false);
                }
                onChangeText?.(text);
              }}
              placeholder={placeholder}
              style={[styles.input, inputStyle, !focusable && styles.disabledInput]}
              onFocus={handleFocus}
              onBlur={handleBlur}
              editable={focusable}
            />
            
            {searchText.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={handleClearText}
                activeOpacity={0.7}
              >
                <AntDesign name="close" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {right && (
          <View style={styles.rightComponentContainer}>
            {right}
          </View>
        )}
      </View>

      {isDropdownOpen && (
        <View style={[
          styles.dropdown, 
          { maxHeight: maxDropdownHeight }
        ]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#999" />
              <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
            </View>
          ) : filteredItems.length > 0 ? (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                if (renderItem) {
                  return renderItem(item) as any;
                }
                
                return (
                  <TouchableOpacity
                    style={[styles.item, itemStyle]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={[styles.itemText, itemTextStyle]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>{noResultsText}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    zIndex: 1000,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    paddingHorizontal: 12,
    zIndex: 1000,
  },
  
  inputWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  
  input: {
    height: 40,
    flex: 1,
    paddingHorizontal: 12,
    paddingRight: 36,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  
  rightComponentContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  
  clearButton: {
    width: 25,
    height: 25,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 5,
    backgroundColor: '#f0f0f0',
  },
  
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#888',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    transform: [{ translateY: -1000 }],
    height: 9999,
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
    zIndex: 1001,
    marginHorizontal: 12,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  noResults: {
    padding: 12,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
});

export default memo(SearchableDropdown);