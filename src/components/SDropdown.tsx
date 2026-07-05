import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
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

const ScrollDownHint = ({ onPress }: { onPress: () => void }) => {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [bounce]);
  return (
    <Pressable style={styles.scrollDownBtn} onPress={onPress}>
      <Animated.View
        style={[
          styles.scrollDownIconWrap,
          { transform: [{ translateY: bounce }] },
        ]}
      >
        <ArrowDown width={20} height={20} color="#555" />
      </Animated.View>
    </Pressable>
  );
};

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
  mode = 'default',
  modalProps,
  maxHeight = 400,
  emptyText = 'Không có dữ liệu',
  renderEmpty,
  ...rests
}: SDropdownProps) => {
  const [isFocus, setIsFocus] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [listContentHeight, setListContentHeight] = useState(0);
  const ref = useRef<any>(null);
  const scrollRef = useRef<any>(null);
  const contentHeightRef = useRef(0);
  const scrollLayoutHeightRef = useRef(0);
  const hasScrolledToSelectedRef = useRef(false);
  const { height: modalHeight, ...nativeModalProps } = modalProps || {};

  const resolvedModalHeight = useMemo(() => {
    const fallbackHeight = maxHeight;
    if (typeof modalHeight !== 'number' || Number.isNaN(modalHeight)) {
      return fallbackHeight;
    }
    return Math.max(220, modalHeight);
  }, [modalHeight, maxHeight]);

  const resolvedScrollHeight = useMemo(() => {
    // Reserve header/action space inside modal.
    return Math.max(120, resolvedModalHeight - 64);
  }, [resolvedModalHeight]);

  const MODAL_HEADER_HEIGHT = 49;

  const fittedModalHeight = useMemo(() => {
    if (listContentHeight <= 0) return resolvedModalHeight;
    const naturalHeight = MODAL_HEADER_HEIGHT + listContentHeight;
    return Math.min(resolvedModalHeight, Math.max(220, naturalHeight));
  }, [listContentHeight, resolvedModalHeight]);

  const fittedScrollHeight = useMemo(() => {
    if (listContentHeight <= 0) return resolvedScrollHeight;
    return Math.min(resolvedScrollHeight, listContentHeight);
  }, [listContentHeight, resolvedScrollHeight]);

  const selectedItem = data.find((item: any) => item[valueField] === value);
  const selectedIndex = data.findIndex(
    (item: any) => item[valueField] === value,
  );

  const scrollToSelectedItem = useCallback(() => {
    if (selectedIndex < 0 || !scrollRef.current) return;
    const itemHeight = 45;
    const y = Math.max(0, selectedIndex * itemHeight - 40);
    scrollRef.current.scrollTo({ y, animated: true });
  }, [selectedIndex]);

  useEffect(() => {
    if (mode === 'modal' && !modalVisible) {
      hasScrolledToSelectedRef.current = false;
      setListContentHeight(0);
    }
  }, [mode, modalVisible]);
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
            setShowScrollDown(false);
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
              <View
                style={[
                  styles.modalScrollWrap,
                  { maxHeight: fittedScrollHeight },
                ]}
              >
                <ScrollView
                  ref={scrollRef}
                  style={[
                    styles.modalScroll,
                    { maxHeight: fittedScrollHeight },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                  onContentSizeChange={(_w, h) => {
                    contentHeightRef.current = h;
                    setListContentHeight(h);
                    const layoutH = scrollLayoutHeightRef.current;
                    setShowScrollDown(layoutH > 0 && h > layoutH);
                    if (
                      modalVisible &&
                      !hasScrolledToSelectedRef.current &&
                      selectedIndex >= 0
                    ) {
                      hasScrolledToSelectedRef.current = true;
                      setTimeout(() => scrollToSelectedItem(), 50);
                    }
                  }}
                  onLayout={(e) => {
                    const { height } = e.nativeEvent.layout;
                    scrollLayoutHeightRef.current = height;
                    const contentH = contentHeightRef.current;
                    setShowScrollDown(contentH > height);
                  }}
                  onScroll={(e) => {
                    const { contentOffset, contentSize, layoutMeasurement } =
                      e.nativeEvent;
                    const canScroll =
                      contentSize.height > layoutMeasurement.height;
                    const nearBottom =
                      contentOffset.y >=
                      contentSize.height - layoutMeasurement.height - 20;
                    setShowScrollDown(canScroll && !nearBottom);
                  }}
                  scrollEventThrottle={32}
                >
                  {data.length > 0
                    ? data.map((item: any) => renderItem(item))
                    : renderEmptyContent()}
                </ScrollView>
                {showScrollDown ? (
                  <ScrollDownHint
                    onPress={() => {
                      scrollRef.current?.scrollTo({
                        y:
                          contentHeightRef.current -
                          scrollLayoutHeightRef.current +
                          20,
                        animated: true,
                      });
                    }}
                  />
                ) : null}
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
  modalScrollWrap: {
    position: 'relative',
    maxHeight: 320,
  },
  modalScroll: {
    maxHeight: 320,
  },
  scrollDownBtn: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  scrollDownIconWrap: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
});
