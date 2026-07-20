import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { cn } from '@/lib/utils';
import { CheckCircleFill, CloseLine } from '../core/svgs';
import ArrowDown from '../core/svgs/ArrowDown';
import SearchLine from '../core/svgs/SearchLine';
import { stringUtils } from '../core/utils/string';
import { Input } from './Input';

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
  mode?: 'default' | 'modal' | 'auto';
  /** Hiển thị khi `data` rỗng (modal mode). */
  emptyText?: string;
  renderEmpty?: () => React.ReactNode;
  /** Gọi khi search đổi (server-side filter). Không truyền → filter client trên `data`. */
  onSearchChange?: (text: string) => void;
  [key: string]: any;
}

const MODAL_HEADER_HEIGHT = 49;
const MODAL_SEARCH_HEIGHT = 44;
/** Ước lượng chiều cao 1 row (tránh đo contentSize → setState → chớp scroll). */
const MODAL_ITEM_HEIGHT_ESTIMATE = 49;

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
  mode = 'default',
  modalProps,
  maxHeight = 400,
  emptyText = 'Không có dữ liệu',
  renderEmpty,
  onSearchChange,
  ...rests
}: SDropdownProps) => {
  const [isFocus, setIsFocus] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const ref = useRef<any>(null);
  const { height: modalHeight, ...nativeModalProps } = modalProps || {};

  const resolvedModalHeight = useMemo(() => {
    const fallbackHeight = maxHeight;
    if (typeof modalHeight !== 'number' || Number.isNaN(modalHeight)) {
      return fallbackHeight;
    }
    return Math.max(220, modalHeight);
  }, [modalHeight, maxHeight]);

  const filteredData = useMemo(() => {
    if (!showSearch || onSearchChange) return data;
    const query = stringUtils.removeAccents(searchText.trim().toLowerCase());
    if (!query) return data;
    return data.filter((item: any) => {
      const title = stringUtils.removeAccents(
        String(item[labelField] ?? '').toLowerCase(),
      );
      const subtitle = stringUtils.removeAccents(
        String(item.subtitle ?? '').toLowerCase(),
      );
      return title.includes(query) || subtitle.includes(query);
    });
  }, [data, labelField, onSearchChange, searchText, showSearch]);

  const listData = showSearch ? filteredData : data;

  const displayListData = useMemo(() => {
    if (!value || listData.length === 0) return listData;
    const selectedIdx = listData.findIndex(
      (item: any) => item[valueField] === value,
    );
    if (selectedIdx <= 0) return listData;
    const selected = listData[selectedIdx];
    return [selected, ...listData.filter((_, index) => index !== selectedIdx)];
  }, [listData, value, valueField]);

  const fittedModalHeight = useMemo(() => {
    const searchOffset = showSearch ? MODAL_SEARCH_HEIGHT : 0;
    const itemCount = Math.max(displayListData.length, 1);
    const estimatedListHeight = itemCount * MODAL_ITEM_HEIGHT_ESTIMATE;
    const naturalHeight =
      MODAL_HEADER_HEIGHT + searchOffset + estimatedListHeight;
    return Math.min(resolvedModalHeight, Math.max(220, naturalHeight));
  }, [displayListData.length, resolvedModalHeight, showSearch]);

  const fittedScrollHeight = useMemo(() => {
    const searchOffset = showSearch ? MODAL_SEARCH_HEIGHT : 0;
    return Math.max(
      120,
      fittedModalHeight - MODAL_HEADER_HEIGHT - searchOffset,
    );
  }, [fittedModalHeight, showSearch]);

  const selectedItem = data.find((item: any) => item[valueField] === value);

  useEffect(() => {
    if (mode === 'modal' && !modalVisible) {
      setSearchText('');
      onSearchChange?.('');
    }
  }, [mode, modalVisible, onSearchChange]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      onSearchChange?.(text);
    },
    [onSearchChange],
  );

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    onSearchChange?.('');
  }, [onSearchChange]);

  const displayText = selectedItem
    ? String(selectedItem[labelField] ?? '')
    : placeholder;

  const renderEmptyContent = () => {
    if (renderEmpty) return renderEmpty();
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  };

  const renderItem = (item: any) => (
    <TouchableOpacity
      key={String(item[valueField])}
      style={[styles.item, item.disabled && { opacity: 0.5 }]}
      onPress={() => {
        if (item.disabled) return;
        onSelect?.(item?.[valueField]);
        setIsFocus(false);
        setModalVisible(false);
        ref.current?.close();
      }}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item[labelField]}</Text>
        {item.subtitle ? (
          <Text style={styles.itemSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      {value === item?.[valueField] && (
        <CheckCircleFill width={20} height={20} color="green" />
      )}
    </TouchableOpacity>
  );

  const triggerRight = (
    <View style={styles.triggerRight}>
      {allowClear && value && (
        <Pressable
          style={styles.clearBtn}
          onPress={(e) => {
            e?.stopPropagation?.();
            if (disabled) return;
            setIsFocus(false);
            onClear?.();
          }}
        >
          <CloseLine width={18} height={18} color="#999999" />
        </Pressable>
      )}
      <ArrowDown width={20} height={20} color="#999999" />
    </View>
  );

  if (mode === 'modal') {
    return (
      <View className={cn('flex flex-col gap-1.5')} style={styles.container}>
        {label && (
          <Text className={cn('text-base', labelClasses)}>{label}</Text>
        )}
        <Pressable
          onPress={() => {
            if (disabled) return;
            Keyboard.dismiss();
            setModalVisible(true);
            setIsFocus(true);
          }}
          style={[
            styles.dropdown,
            isFocus && styles.dropdownFocused,
            disabled && styles.dropdownDisabled,
          ]}
        >
          <Text
            style={[
              styles.triggerText,
              !selectedItem && styles.triggerPlaceholder,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayText}
          </Text>
          {triggerRight}
        </Pressable>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          {...nativeModalProps}
          presentationStyle="overFullScreen"
          onRequestClose={() => {
            setModalVisible(false);
            setIsFocus(false);
          }}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              setModalVisible(false);
              setIsFocus(false);
            }}
          >
            <Pressable
              style={[styles.modalContent, { maxHeight: fittedModalHeight }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {label || placeholder}
                </Text>
                <Pressable
                  hitSlop={12}
                  onPress={() => {
                    setModalVisible(false);
                    setIsFocus(false);
                  }}
                  style={styles.modalCloseBtn}
                >
                  <CloseLine width={22} height={22} color="#666" />
                </Pressable>
              </View>
              {showSearch ? (
                <View style={styles.modalSearchWrap}>
                  <Input
                    className="gap-0"
                    inputClasses="text-sm"
                    style={styles.modalSearchInput}
                    placeholder={
                      searchPlaceholder ||
                      'Tìm kiếm theo mã nhân viên, tên nhân viên'
                    }
                    prefix={<SearchLine width={16} height={16} />}
                    value={searchText}
                    onChangeText={handleSearchChange}
                    allowClear
                    onClear={handleClearSearch}
                    autoFocus
                  />
                </View>
              ) : null}
              <View
                style={[
                  styles.modalScrollWrap,
                  { maxHeight: fittedScrollHeight },
                ]}
              >
                <ScrollView
                  style={[
                    styles.modalScroll,
                    { maxHeight: fittedScrollHeight },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {displayListData.length > 0
                    ? displayListData.map((item: any) => renderItem(item))
                    : renderEmptyContent()}
                </ScrollView>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  return (
    <View className={cn('flex flex-col gap-1.5')} style={styles.container}>
      {label && <Text className={cn('text-base', labelClasses)}>{label}</Text>}
      <Dropdown
        ref={ref}
        style={[
          styles.dropdown,
          isFocus && styles.dropdownFocused,
          disabled && styles.dropdownDisabled,
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
        renderRightIcon={() => triggerRight}
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
    borderColor: 'rgb(203 213 225)',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownFocused: {
    borderColor: 'rgb(203 213 225)',
  },
  dropdownDisabled: {
    backgroundColor: 'rgb(243 244 246)',
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: '#111',
  },
  triggerPlaceholder: {
    color: '#999999',
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearBtn: {
    padding: 4,
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
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    color: '#111',
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#718096',
  },
  emptyContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalContent: {
    alignSelf: 'stretch',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchWrap: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalSearchInput: {
    height: 36,
    paddingVertical: 6,
    fontSize: 14,
    lineHeight: 18,
  },
  modalScrollWrap: {
    position: 'relative',
    maxHeight: 320,
  },
  modalScroll: {
    maxHeight: 320,
  },
});
