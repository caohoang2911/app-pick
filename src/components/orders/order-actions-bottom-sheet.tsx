import { Feather } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import SBottomSheet from '../SBottomSheet';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { MaterialIcons } from '@expo/vector-icons';
import { useDriverOrderActions } from '~/src/core/hooks/useDriverOrderActions';
import { isEnableScanToDelivery } from '~/src/core/utils/order';
import { OrderStatus } from '~/src/types/order';

interface OrderActionsBottomSheetProps {
  orderCode: string;
  orderStatus?: string;
  orderType?: string;
  status?: string;
  visible: boolean;
  onClose: () => void;
}

export interface OrderActionsBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

const OrderActionsBottomSheet = forwardRef<OrderActionsBottomSheetRef, OrderActionsBottomSheetProps>(
  ({ orderCode, status, visible, onClose }, ref) => {
    const bottomSheetRef = useRef<OrderActionsBottomSheetRef>(null);

    const {
      isDriver,
      handleOrderInfo,
      handlePickOrder,
      handleScanBagDelivery,
      handleAssignOrder,
    } = useDriverOrderActions(orderCode);

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => {
        bottomSheetRef.current?.dismiss();
      },
    }));

    const handleOrderInfoWithClose = () => {
      onClose();
      handleOrderInfo();
    };

    const handlePickOrderWithClose = () => {
      onClose();
      handlePickOrder();
    };

    const handleScanBagDeliveryWithClose = () => {
      onClose();
      handleScanBagDelivery();
    };

    const handleAssignOrderWithClose = () => {
      onClose();
      handleAssignOrder();
    };


    const ActionItem = ({ 
      icon, 
      title, 
      enabled = true,
      onPress 
    }: { 
      icon: string | React.ReactNode; 
      title: string; 
      enabled?: boolean;
      onPress: () => void; 
    }) => (
      <Pressable
        disabled={!enabled}
        style={{
          backgroundColor: enabled ? '' : 'rgba(0, 0, 0, 0.05)',
          opacity: enabled ? 1 : 0.3,
        }}
        onPress={onPress}
        className="flex flex-row items-center py-4 px-2 border-b border-gray-200"
      >
        <View className="mr-4">
          {typeof icon === 'string' ? <Feather name={icon as any} size={20} color="#374151" /> : icon}
        </View>
        <Text className="text-base text-gray-800 font-medium">{title}</Text>
      </Pressable>
    );

  return (
    <>
      <SBottomSheet
        ref={bottomSheetRef}
        visible={visible}
        onClose={onClose}
        snapPoints={[isDriver ? 260 : 270]}
        title="Thao tác"
        renderTitle={
          <View className="flex flex-row items-center">
            <Text className="font-semibold text-lg">Thao tác</Text>
            <Text className="font-semibold text-lg ml-2">{orderCode}</Text>
          </View>
        }
        titleAlign="left"
      >
        <View className="px-4">
          {isDriver ? (
            // Driver options
            <>
              <ActionItem
                icon="file-text"
                title="Thông tin đơn hàng"
                onPress={handleOrderInfoWithClose}
                enabled={true}
              />
              <ActionItem
                icon={<MaterialIcons name="person-add-alt" size={20} color="#374151" />}
                title="Gán đơn cho tôi"
                onPress={handleAssignOrderWithClose}
                enabled={true}
              />
            </>
          ) : (
            // Non-driver options
            <>
              <ActionItem
                icon={<MaterialCommunityIcons name="barcode-scan" size={20} color="black" />}
                title="Pick đơn hàng"
                onPress={handlePickOrderWithClose}
                enabled={true}
              />
              <ActionItem
                icon="file-text"
                title="Thông tin đơn hàng"
                onPress={handleOrderInfoWithClose}
                enabled={true}
              />
              <ActionItem
                icon="package"
                title="Scan túi - Giao hàng"
                onPress={handleScanBagDeliveryWithClose}
                enabled={isEnableScanToDelivery({ status: status as OrderStatus })}
              />
            </>
          )}
        </View>
      </SBottomSheet>
    </>
  );
  }
);

OrderActionsBottomSheet.displayName = 'OrderActionsBottomSheet';

export default OrderActionsBottomSheet;

