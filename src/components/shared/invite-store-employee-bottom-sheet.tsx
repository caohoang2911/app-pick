import { AntDesign } from '@expo/vector-icons';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import React, { memo, useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { ActionFromNotification } from '~/src/core/hooks/usePushNotifications';
import { useAcceptInviteEmployeeToStore } from '../../api/app-pick/use-accept-invite-employee-to-store';
import { useConfig } from "../../core/store/config";
import { setInviteBottomSheetVisible, useEmployeeManage } from "../../core/store/employee-manage";
import { getConfigNameById } from "../../core/utils/config";
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';


const InviteStoreEmployeeBottomSheet = memo(() => {
  const modalRef = useRef<any>();
  const router = useRouter();
  const params = useGlobalSearchParams<{
    action?: string;
    inviteToken?: string;
    storeCode?: string;
  }>();

  // Get global state
  const inviteBottomSheetVisible = useEmployeeManage.use.inviteBottomSheetVisible();

  // Check if we should show the bottom sheet
  const shouldShowBottomSheet = inviteBottomSheetVisible;
  const storeCode = params.storeCode;

  const isModalVisible = useRef(false);

  const config = useConfig.use.config();
  const stores = config?.stores || [];
  const storeName = getConfigNameById(stores, storeCode);

  // Detect params change and update global state
  useEffect(() => {
    const shouldShowInviteSheet = !!(params.action === ActionFromNotification.SHOW_POPUP_INVITE_STORE_EMPLOYEE && params.inviteToken);
    setInviteBottomSheetVisible(shouldShowInviteSheet);
    
  }, [params.action, params.inviteToken, params.storeCode, params.inviteToken]);

  // API mutation for accepting invites
  const { mutate: acceptInvite, isPending: isHandlingInvite } = useAcceptInviteEmployeeToStore(
    // onSuccess
    () => {
      handleClose();
    },
    // onError
    (error: string) => {
      console.error('Error accepting invite:', error);
    }
  );

  useEffect(() => {
    if (shouldShowBottomSheet && !isModalVisible.current) {
      modalRef.current?.present();
      isModalVisible.current = true;
    }
  }, [shouldShowBottomSheet, isModalVisible.current]);

  const handleClose = useCallback(() => {
    setInviteBottomSheetVisible(false);
    isModalVisible.current = false;
    // Clear the query parameters
    router.setParams({ action: undefined, inviteToken: undefined, storeCode: undefined });
  }, [router]);

  
  const handleAcceptInvite = useCallback(() => {
    if (params.inviteToken) {
      acceptInvite({ 
        inviteToken: params.inviteToken
      });
    }
  }, [params, acceptInvite]);

  const handleDeclineInvite = useCallback(() => {
    handleClose();
  }, [params.inviteToken, handleClose]);

  if (!shouldShowBottomSheet) {
    return null;
  }

  return (
    <SBottomSheet
      ref={modalRef}
      visible={shouldShowBottomSheet}
      title="Mời tham gia siêu thị"
      onClose={handleClose}
      snapPoints={[230]}
    >
      <View className="px-4 py-6">
        {/* Content */}
        <View className="mb-8">
          <Text className="text-base text-gray-800 leading-6">
            Bạn có đồng ý tham gia siêu thị {storeName}?
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-end gap-3">
          {/* Accept Button */}
          <Button
            onPress={handleAcceptInvite}
            disabled={isHandlingInvite}
            loading={isHandlingInvite}
            variant="default"
            size="default"
            label="Đồng ý"
            icon={<AntDesign name="check" size={16} color="white" />}
            className="bg-green-500"
          />

          {/* Decline Button */}
          <Button
            onPress={handleDeclineInvite}
            disabled={isHandlingInvite}
            variant="danger"
            size="default"
            label="Từ chối"
            icon={<AntDesign name="close" size={16} color="white" />}
          />
        </View>
      </View>
    </SBottomSheet>
  );
});

InviteStoreEmployeeBottomSheet.displayName = 'InviteStoreEmployeeBottomSheet';

export default InviteStoreEmployeeBottomSheet; 