import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { useRemoveStoreEmployee } from '~/src/api/app-pick/use-remove-store-employee';
import { useSearchStoreEmployees } from '~/src/api/app-pick/use-search-store-employees';
import { useAuth } from '~/src/core';
import {
  ActionMenuItem,
  Employee,
  setActionMenuVisible,
  setAddEmployeeModalVisible,
  setSearchQuery,
  setSelectedEmployee,
  useEmployeeManage
} from '~/src/core/store/employee-manage';
import { colors } from '~/src/ui/colors';

// Import separated components
import ActionMenu from './action-menu';
import AddEmployeeModal from './add-employee-modal';
import EmployeeItem from './employee-item';
import EmptyState from './empty-state';
import SearchBar from './search-bar';

const Employees = () => {
  // Zustand state
  const searchQuery = useEmployeeManage.use.searchQuery();
  const selectedEmployee = useEmployeeManage.use.selectedEmployee();
  const actionMenuVisible = useEmployeeManage.use.actionMenuVisible();
  const addEmployeeModalVisible = useEmployeeManage.use.addEmployeeModalVisible();

  // Get user info for store code
  const userInfo = useAuth.use.userInfo();
  const { storeCode } = userInfo || {};

  // Remove employee mutation
  const { mutate: removeEmployeeFromStore, isPending: isRemoving } = useRemoveStoreEmployee(
    // onSuccess
    () => {
      setActionMenuVisible(false);
      setSelectedEmployee(null);
    },
    // onError
    (error) => {
      Alert.alert('Lỗi', error);
    }
  );

  // React Query for employee data
  const { data: employeeResponse, isLoading, error, refetch, isRefetching } = useSearchStoreEmployees({
    keyword: searchQuery,
    storeCode: storeCode || '',
    pageIndex: 1,
    limit: 20,
  });

  console.log('employeeResponse', employeeResponse);

  // Transform API data to match our Employee interface
  const employees = useMemo(() => {
    if (!employeeResponse?.data?.list) return [];
    
    return employeeResponse.data.list.map(employee => ({
      id: employee.id,
      employeeId: employee.username,
      name: employee.name,
      role: employee.role,
      status: employee.status,
      storeCode: employee.storeCode,
      fcmToken: employee.fcmToken,
      tenants: employee.tenants,
      createdTime: employee.createdTime,
      lastAccessedTime: employee.lastAccessedTime,
    }));
  }, [employeeResponse?.data?.list]);

  // Handle employee action
  const handleEmployeeAction = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setActionMenuVisible(true);
  }, []);

  // Action menu items
  const actionMenuItems = useCallback((): ActionMenuItem[] => [
    {
      id: 'remove',
      title: 'Remove NV khỏi cửa hàng',
      icon: <MaterialIcons name="person-remove" size={24} color="#DC2626" />,
      onPress: () => {
        if (selectedEmployee) {
          Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc chắn muốn xóa nhân viên "${selectedEmployee.name}" khỏi cửa hàng?`,
            [
              {
                text: 'Hủy',
                style: 'cancel',
              },
              {
                text: 'Xóa',
                style: 'destructive',
                onPress: () => {
                  removeEmployeeFromStore({ employeeCode: selectedEmployee.employeeId });
                },
              },
            ]
          );
        }
      },
      destructive: true,
      disabled: isRemoving,
    },
    
  ], [selectedEmployee, removeEmployeeFromStore, isRemoving]);

  // Render employee item
  const renderEmployeeItem = useCallback(({ item }: { item: Employee }) => (
    <EmployeeItem
      employee={item}
      onPressAction={handleEmployeeAction}
    />
  ), [handleEmployeeAction]);

  // Key extractor
  const keyExtractor = useCallback((item: Employee) => item.id.toString(), []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <SearchBar onSearch={setSearchQuery} />
      
      {/* Employee List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color={colors.colorPrimary} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-red-500 text-center">Có lỗi xảy ra khi tải dữ liệu</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          renderItem={renderEmployeeItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[colors.colorPrimary]}
              tintColor={colors.colorPrimary}
            />
          }
        />
      )}
      
      {/* Action Menu */}
      <ActionMenu
        visible={actionMenuVisible}
        onClose={() => setActionMenuVisible(false)}
        actions={actionMenuItems()}
      />
      
      {/* Add Employee Modal */}
      <AddEmployeeModal
        visible={addEmployeeModalVisible}
        onClose={() => setAddEmployeeModalVisible(false)}
      />
    </View>
  );
};

export default Employees;
