import { AntDesign, Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useGetStoreEmployeeProfile } from '~/src/api/app-pick/use-get-store-employee-profile';
import { useSendInviteEmployeeToStore } from '~/src/api/app-pick/use-send-invite-employee-to-store';
import { useAuth } from '~/src/core';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import { colors } from '~/src/ui/colors';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';

// Types
interface AddEmployeeModalProps {
  visible: boolean;
  onClose: () => void;
}

interface EmployeeInfoCardProps {
  employee: any;
  employeeRoles: any[];
  storeName?: string;
}

interface InviteButtonProps {
  onPress: () => void;
  disabled: boolean;
  isInviting: boolean;
}

// Constants
const MODAL_SNAP_POINTS = [320];
const SEARCH_PLACEHOLDER = "Nhập mã nhân viên";
const SUCCESS_MESSAGE = 'Đã gửi lời mời nhân viên thành công!';
const LOADING_TEXT = 'Đang tìm kiếm...';
const NOT_FOUND_TEXT = 'Không tìm thấy nhân viên';
const INVITE_BUTTON_TEXT = 'Mời nhân viên';
const INVITING_TEXT = 'Đang gửi lời mời...';

// Components
const EmployeeInfoCard = memo(({ employee, employeeRoles, storeName }: EmployeeInfoCardProps) => (
  <View className="bg-gray-50 rounded-lg p-3">
    <View className="flex-row">
      <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center mr-2">
        <Feather name="user" size={16} color={colors.gray[500]} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium">
          {employee.username} - {employee.name}
        </Text>
        <View className="flex-row gap-2">
          <View className="bg-blue-100 py-1 rounded-md">
            <Text className="text-xs font-medium text-blue-600">
              {getConfigNameById(employeeRoles, employee.role) || employee.role}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-md ${
            employee.status === 'ACTIVE' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Text className={`text-xs font-medium ${
              employee.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
            }`}>
              {employee.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
            </Text>
          </View>
        </View>
      </View>
    </View>
    
    <View className="flex-row items-center">
      <View className="size-8 rounded-full items-center justify-center mr-2">
        <Feather name="map-pin"  size={16} color={colors.gray[500]} />
      </View>
      <Text className="text-sm text-gray-600 ">
        {employee.storeCode} - {storeName}
      </Text>
    </View>
  </View>
));

const InviteButton = memo(({ onPress, disabled, isInviting }: InviteButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className={`w-full py-3 mt-3 rounded-lg ${
      isInviting ? 'bg-gray-300' : 'bg-blue-500'
    }`}
  >
    {isInviting ? (
      <View className="flex-row items-center justify-center">
        <ActivityIndicator size="small" color="white" />
        <Text className="text-white font-medium ml-2">{INVITING_TEXT}</Text>
      </View>
    ) : (
      <Text className="text-center text-white font-semibold text-base">
        {INVITE_BUTTON_TEXT}
      </Text>
    )}
  </TouchableOpacity>
));

const LoadingState = memo(() => (
  <View className="items-center py-4">
    <ActivityIndicator size="small" color={colors.gray[500]} />
    <Text className="text-sm text-gray-500 mt-2">{LOADING_TEXT}</Text>
  </View>
));

const NotFoundState = memo(() => (
  <View className="items-center py-4">
    <Text className="text-sm text-gray-500">{NOT_FOUND_TEXT}</Text>
  </View>
));

// Main Component
const AddEmployeeModal = memo(({ visible, onClose }: AddEmployeeModalProps) => {
  // State
  const [employeeCode, setEmployeeCode] = useState('');
  const modalRef = useRef<any>();
  
  // Hooks
  const userInfo = useAuth.use.userInfo();
  const config = useConfig.use.config();
  const employeeRoles = config?.employeeRoles || [];
  
  // Effects
  useEffect(() => {
    if (visible) {
      modalRef.current?.present();
    }
  }, [visible]);

  // API Queries
  const { data: employeeProfile, isLoading: searching } = useGetStoreEmployeeProfile({
    employeeCode: employeeCode,
  });

  const { mutate: sendInvite, isPending: isInviting } = useSendInviteEmployeeToStore(
    () => {
      setEmployeeCode('');
      onClose();
      showMessage({
        type: 'success',
        message: SUCCESS_MESSAGE
      });
    },
  );

  // Handlers
  const handleInviteEmployee = useCallback((username: string) => {
    sendInvite({ employeeCode: username });
  }, [sendInvite]);

  const handleClearSearch = useCallback(() => {
    setEmployeeCode('');
  }, []);

  const stores = config?.stores || [];

  // Computed values
  const employee = employeeProfile?.data;
  const hasSearchText = employeeCode.trim() !== '';
  const showEmployeeInfo = employeeCode && !searching && employee;
  const showNotFound = employeeCode && !searching && !employee && hasSearchText;

  const storeName = getConfigNameById(stores, userInfo?.storeCode);

  return (
    <SBottomSheet
      ref={modalRef}
      visible={visible}
      title="Thêm NV vào cửa hàng"
      onClose={onClose}
      snapPoints={MODAL_SNAP_POINTS}
    >
      <View className="px-4 mt-4">
        {/* Search Input */}
        <View className="mb-4">
          <Input
            className="bg-gray-50"
            inputClasses="bg-gray-50 border-0 text-base"
            placeholder={SEARCH_PLACEHOLDER}
            value={employeeCode}
            onChangeText={setEmployeeCode}
            prefix={<AntDesign name="user" size={20} color={colors.gray[500]} />}
            suffix={searching ? <ActivityIndicator size="small" color={colors.gray[500]} /> : undefined}
            allowClear={true}
            onClear={handleClearSearch}
            useBottomSheetTextInput
          />
        </View>
        
        {/* Employee Profile Section */}
        {employeeCode && (
          <View className="mb-4">
            {searching && <LoadingState />}
            
            {showEmployeeInfo && (
              <>
                <EmployeeInfoCard
                  employee={employee}
                  storeName={storeName}
                  employeeRoles={employeeRoles}
                  onInvite={handleInviteEmployee}
                  isInviting={isInviting}
                />
                <InviteButton
                  onPress={() => handleInviteEmployee(employee.username)}
                  disabled={isInviting}
                  isInviting={isInviting}
                />
              </>
            )}
            
            {showNotFound && <NotFoundState />}
          </View>
        )}
      </View>
    </SBottomSheet>
  );
});

// Display names for debugging
EmployeeInfoCard.displayName = 'EmployeeInfoCard';
InviteButton.displayName = 'InviteButton';
LoadingState.displayName = 'LoadingState';
NotFoundState.displayName = 'NotFoundState';
AddEmployeeModal.displayName = 'AddEmployeeModal';

export default AddEmployeeModal; 