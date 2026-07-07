import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useAcceptTokenAssignEmployeeToStore } from '~/src/api/app-pick/use-accept-token-assign-employee-to-store';
import {
  useGetQRAccessTokenInfo,
  type QRAccessTokenInfoPayload,
} from '~/src/api/app-pick/use-get-qr-access-token-info';
import { useRemoveEmployeeFromStore } from '~/src/api/app-pick/use-remove-employee-from-store';
import {
  useSearchStoreEmployees,
  type StoreEmployeeItem,
} from '~/src/api/app-pick/use-search-store-employees';
import ButtonBack from '~/src/components/ButtonBack';
import EmployeeItem from '~/src/components/employee-management/employee-item';
import { Input } from '~/src/components/Input';
import ScannerBox, {
  type BarcodeScanningResult,
} from '~/src/components/shared/scanner-box';
import Header from '~/src/components/shared/header';
import { useAuth } from '~/src/core';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import SearchLine from '~/src/core/svgs/SearchLine';
import { getConfigNameById } from '~/src/core/utils/config';
import { canManageStoreEmployees } from '~/src/core/utils/employee';

export default function EmployeeManagementScreen() {
  const userInfo = useAuth.use.userInfo();
  const canAccess = canManageStoreEmployees(userInfo?.role);

  const config = useConfig.use.config();
  const employeeRoles = config?.employeeRoles || [];
  const stores = config?.stores || [];

  const [searchText, setSearchText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [scannerVisible, setScannerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // searchStoreEmployees trả về mọi nhân viên của siêu thị (mọi role + mọi
  // trạng thái, gồm cả "Ngưng hoạt động").
  const { data, isLoading, isFetching, refetch } = useSearchStoreEmployees(
    keyword,
    canAccess,
  );
  const employees = data ?? [];

  const { mutate: acceptToken } = useAcceptTokenAssignEmployeeToStore(() =>
    refetch(),
  );
  const { mutate: removeEmployee } = useRemoveEmployeeFromStore(() =>
    refetch(),
  );

  const handleQRTokenInfo = useCallback(
    (info: QRAccessTokenInfoPayload, token: string) => {
      const storeName =
        getConfigNameById(stores, info.storeCode) || info.storeCode;

      showAlert({
        title: 'Thêm nhân viên vào siêu thị',
        message: `Bạn có chắc muốn thêm nhân viên này vào siêu thị?\n\nSiêu thị: ${storeName}\nNhân viên: ${info.employeeName}\nMã NV: ${info.employeeCode}`,
        onConfirm: () => {
          hideAlert();
          setLoading(true);
          acceptToken({ token });
        },
      });
    },
    [acceptToken, stores],
  );

  const { mutate: fetchQRTokenInfo } =
    useGetQRAccessTokenInfo(handleQRTokenInfo);

  const debouncedSetKeyword = useMemo(
    () => debounce((text: string) => setKeyword(text), 300),
    [],
  );

  useEffect(() => () => debouncedSetKeyword.cancel(), [debouncedSetKeyword]);

  const handleChangeText = useCallback(
    (text: string) => {
      setSearchText(text);
      debouncedSetKeyword(text);
    },
    [debouncedSetKeyword],
  );

  const handleClear = useCallback(() => {
    setSearchText('');
    debouncedSetKeyword.cancel();
    setKeyword('');
  }, [debouncedSetKeyword]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleScanned = useCallback(
    (result: BarcodeScanningResult) => {
      setScannerVisible(false);
      const token = result?.data?.trim();
      if (!token) return;

      setLoading(true);
      fetchQRTokenInfo({ token });
    },
    [fetchQRTokenInfo],
  );

  const handleRemove = useCallback(
    (employee: StoreEmployeeItem) => {
      showAlert({
        title: 'Xoá nhân viên',
        message: `Xoá ${employee.name} khỏi siêu thị?`,
        confirmText: 'Xoá',
        onConfirm: () => {
          hideAlert();
          setLoading(true);
          removeEmployee({ employeeCode: employee.username });
        },
      });
    },
    [removeEmployee],
  );

  const renderItem = useCallback(
    ({ item }: { item: StoreEmployeeItem }) => (
      <EmployeeItem
        employee={item}
        roleLabel={getConfigNameById(employeeRoles, item.role) || item.role}
        onRemove={handleRemove}
      />
    ),
    [employeeRoles, handleRemove],
  );

  if (!canAccess) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-4 text-center text-gray-500">
          Bạn không có quyền truy cập tính năng này
        </Text>
        <ButtonBack />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        headerLeft={<ButtonBack />}
        title="Quản lý nhân viên siêu thị"
        headerRight={
          <Pressable onPress={() => setScannerVisible(true)} hitSlop={10}>
            <Ionicons name="person-add-outline" size={22} color="#2563EB" />
          </Pressable>
        }
      />

      <View className="px-4 pb-1 pt-3">
        <Input
          placeholder="Tìm kiếm nhân viên"
          prefix={<SearchLine width={18} height={18} opacity={0.5} />}
          value={searchText}
          onChangeText={handleChangeText}
          allowClear
          onClear={handleClear}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item, index) => `${item.id ?? item.username}-${index}`}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || (isFetching && !isLoading)}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <View className="items-center pt-8">
              <Text className="text-gray-400">Không có nhân viên</Text>
            </View>
          }
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        />
      )}

      <ScannerBox
        visible={scannerVisible}
        isQRScanner
        hideScannerToggle
        onSuccessBarcodeScanned={handleScanned}
        onDestroy={() => setScannerVisible(false)}
      />
    </View>
  );
}
