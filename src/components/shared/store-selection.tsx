import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { debounce } from 'lodash';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Portal } from '@gorhom/portal';
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRequestAssignMeToStore } from '~/src/api/app-pick/use-request-assign-me-to-store';
import { useKeyboardVisible } from '~/src/core/hooks/useKeyboardVisible';
import { useAuth } from '~/src/core/store/auth';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { CheckCircleFill, CloseLine } from '~/src/core/svgs';
import SearchLine from '~/src/core/svgs/SearchLine';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import { EmployeeRole } from '~/src/types/employee';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import Empty from './empty';
import Header from './header';
import StoreTransferQR from './store-transfer-qr';

type StoreType = Option & { address: string; tenant: string };

// Roles chuyển siêu thị TRỰC TIẾP (assignMeToStore), không đi qua flow yêu cầu +
// QR của nhân viên. TC (STORE_SHIFT_SUPERVISOR) là role quản lý — gộp cùng
// SM/ADMIN để không bị hạ role về STORE khi chuyển siêu thị.
const ADMIN_ROLES = [
  'STORE_MANAGER',
  'ADMIN',
  'STORE_SHIFT_SUPERVISOR',
] as const;

// Tách thành component riêng để tránh re-render không cần thiết
const StoreItem = memo(
  ({
    store,
    selectedId,
    onSelect,
  }: {
    store: StoreType;
    selectedId: string;
    onSelect: (store: StoreType) => void;
  }) => {
    const isSelected = selectedId === String(store.id);

    const handlePress = useCallback(() => {
      if (isSelected) return;
      onSelect(store);
    }, [store, isSelected, onSelect]);

    return (
      <TouchableOpacity disabled={isSelected} onPress={handlePress}>
        <View className="p-4 border-b border-gray-200">
          <View className="flex flex-row items-center gap-1">
            {isSelected && (
              <CheckCircleFill width={15} height={15} color="green" />
            )}
            <Text className="text-lg font-semibold">{store.name}</Text>
          </View>
          <Text className="text-sm text-gray-600">{store.address}</Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.store.id === nextProps.store.id &&
      prevProps.store.name === nextProps.store.name &&
      prevProps.store.address === nextProps.store.address &&
      prevProps.selectedId === nextProps.selectedId &&
      prevProps.onSelect === nextProps.onSelect
    );
  },
);

StoreItem.displayName = 'StoreItem';

// Tách SearchBar thành component riêng
const SearchBar = memo(
  forwardRef<
    any,
    {
      onSearch: (text: string) => void;
    }
  >(({ onSearch }, ref) => {
    const [searchText, setSearchText] = useState('');
    const inputRef = useRef<any>(null);

    // Expose focus method
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          inputRef.current?.focus();
        },
      }),
      [],
    );

    // Debounce search - use useMemo to ensure stable reference
    const debouncedSearch = useMemo(
      () =>
        debounce((text: string) => {
          onSearch(text);
        }, 300),
      [onSearch],
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        debouncedSearch.cancel();
      };
    }, [debouncedSearch]);

    const handleChangeText = useCallback(
      (value: string) => {
        setSearchText(value);
        debouncedSearch(value);
      },
      [debouncedSearch],
    );

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
  }),
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

    const userInfo = useAuth.use.userInfo();

    // Memoize extracted values to prevent unnecessary re-renders
    const userCode = useMemo(() => userInfo?.username, [userInfo?.username]);
    const role = useMemo(() => userInfo?.role, [userInfo?.role]);
    const userTenant = useMemo(
      () => userInfo?.tenant?.toString(),
      [userInfo?.tenant],
    );

    // Nhớ store vừa chọn để hiển thị trong overlay QR.
    const selectedStoreRef = useRef<StoreType | null>(null);
    const [qrToken, setQrToken] = useState<string | null>(null);
    const [showQr, setShowQr] = useState(false);

    // Nhận token (data) rồi hiện overlay QR (Portal) để SM/TC siêu thị đích quét
    // duyệt. Dùng Portal (như ScannerBox) thay vì điều hướng route: tránh bị
    // portal của bottom sheet che và không phụ thuộc route mới đăng ký.
    const onSuccessCallback = useCallback((token: string) => {
      actionRef.current?.dismiss?.();
      setVisible(false);
      setQrToken(token ?? '');
      setShowQr(true);
    }, []);

    const { mutate: requestAssignMeToStore } =
      useRequestAssignMeToStore(onSuccessCallback);

    const handleRegenerate = useCallback(() => {
      const store = selectedStoreRef.current;
      if (!store) return;
      setLoading(true);
      requestAssignMeToStore({
        storeCode: store.id.toString(),
        employeeCode: code || userCode || '',
        role: EmployeeRole.STORE,
      });
    }, [code, userCode, requestAssignMeToStore]);

    const handleCloseQr = useCallback(() => {
      setShowQr(false);
      setQrToken(null);
    }, []);

    const isKeyboardVisible = useKeyboardVisible();

    // Memoize tenant-filtered stores separately to avoid re-filtering on search changes
    const tenantFilteredStores = useMemo(() => {
      if (newbie) return stores || [];
      if (!stores || !userTenant) return [];

      return stores.filter((store: StoreType) => store.tenant === userTenant);
    }, [stores, userTenant]);

    // Memoize the filtered and sorted stores
    const filteredStores = useMemo(() => {
      if (!tenantFilteredStores.length) return stores;

      // First filter by search query
      const searchFiltered = searchQuery
        ? tenantFilteredStores.filter((store: StoreType) => {
            const query = stringUtils.removeAccents(searchQuery.toLowerCase());
            const storeName = stringUtils.removeAccents(
              store.name?.toLowerCase() || '',
            );
            return storeName.includes(query);
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
      [],
    );

    // Memoize event handlers
    const handleClose = useCallback(() => {
      setVisible(false);
      setSearchQuery('');
    }, []);

    const handleSelect = useCallback(
      (store: StoreType) => {
        if (role && ADMIN_ROLES.includes(role as any)) {
          setVisible(false);
          onSelect?.(store);
          return;
        }
        showAlert({
          title: 'Yêu cầu cấp quyền siêu thị',
          message: `Bạn có muốn yêu cầu cấp quyền siêu thị ${store.name} không?`,
          onConfirm: () => {
            hideAlert();
            setLoading(true);
            selectedStoreRef.current = store;
            requestAssignMeToStore({
              storeCode: store.id.toString(),
              employeeCode: code || userCode || '',
              role: EmployeeRole.STORE,
            });
          },
        });
      },
      [onSelect, code, userCode, role, requestAssignMeToStore],
    );

    const handleSearch = useCallback((text: string) => {
      setSearchQuery(text);
    }, []);

    // Memoize list rendering
    const renderItem = useCallback(
      ({ item }: { item: StoreType }) => (
        <StoreItem
          store={item}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      ),
      [selectedId, handleSelect],
    );

    const keyExtractor = useCallback(
      (item: StoreType) => item.id.toString(),
      [],
    );

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
      <>
        <SBottomSheet
          visible={visible}
          title="Chọn cửa hàng"
          ref={actionRef}
          snapPoints={[700, '80%']}
          keyboardBehavior="fillParent"
          onClose={handleClose}
          scrollEnabled={false}
          disableScrollView={true}
        >
          <SearchBar ref={searchBarRef} onSearch={handleSearch} />

          <BottomSheetFlatList
            data={filteredStores}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            // Tối ưu ảo hóa: giảm số item dựng đồng bộ lúc mở (khi sheet đang
            // animate) và trải đều phần còn lại → nhẹ hơn khi mở. Chỉ đổi tham
            // số render, không đổi data/logic/tương tác.
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={false}
            ListEmptyComponent={ListEmptyComponent}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom:
                Platform.OS === 'android' && isKeyboardVisible ? 260 : 16,
            }}
          />
        </SBottomSheet>
        {showQr && (
          <Portal>
            <View style={styles.qrOverlay}>
              <SafeAreaView edges={['top']} style={styles.qrSafe}>
                <Header
                  headerLeft={
                    <TouchableOpacity onPress={handleCloseQr} hitSlop={15}>
                      <CloseLine />
                    </TouchableOpacity>
                  }
                />
                <StoreTransferQR
                  token={qrToken ?? ''}
                  storeName={selectedStoreRef.current?.name}
                  employeeCode={code || userCode || ''}
                  employeeName={userInfo?.name}
                  onRegenerate={handleRegenerate}
                />
              </SafeAreaView>
            </View>
          </Portal>
        )}
      </>
    );
  },
);

const styles = StyleSheet.create({
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    zIndex: 9999,
    elevation: 9999,
  },
  qrSafe: { flex: 1 },
});

export default React.memo(StoreSelection);
