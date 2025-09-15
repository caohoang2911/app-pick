import RadioButtonGroup, { RadioButtonItem } from "expo-radio-button";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useDriverSetMyOrderAssignStatus } from '~/src/api/app-pick-driver/useDriverSetMyOrderAssignStatus';
import { setUser, useAuth } from '~/src/core/store/auth';
import { setUserInfo } from '~/src/core/store/auth/utils';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';

interface OrderStatusModalProps {
  currentStatus?: 'ENABLE' | 'DISABLE';
  onClose: () => void;
}

export interface OrderStatusModalRef {
  present: () => void;
}

const OrderStatusBottomSheet = forwardRef<OrderStatusModalRef, OrderStatusModalProps>(
  ({ onClose, currentStatus = 'ENABLE' }, ref) => {
    const userInfo = useAuth.use.userInfo();

    const { mutate: setMyOrderAssignStatus } = useDriverSetMyOrderAssignStatus(() => {
      const newDriverOrderAssignStatus = userInfo.driverOrderAssignStatus === "ENABLE" ? "DISABLE" : "ENABLE";
  
      setUserInfo({
        ...userInfo,
        driverOrderAssignStatus: newDriverOrderAssignStatus,
      });
      setUser({
        ...userInfo,
        driverOrderAssignStatus: newDriverOrderAssignStatus,
      });
      onClose();
      setVisible(false);
    });

    const [selectedStatus, setSelectedStatus] = useState<'ENABLE' | 'DISABLE'>(currentStatus);
    const [visible, setVisible] = useState(false);
    const actionRef = useRef<any>();
  
    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => {
            setVisible(!visible);
          },
        };
      },
      []
    );
  
    useEffect(() => {
      if (visible) {
        actionRef.current?.present();
      }
    }, [visible]);

    const handleConfirm = () => {
      setMyOrderAssignStatus({ status: selectedStatus });
    };
  

    return (
      <SBottomSheet
        ref={actionRef}
        visible={visible}
        onClose={() => setVisible(false)}
        title="Trạng thái nhận đơn"
        snapPoints={[220]}
      >
        <View className="px-4 mt-4">
          <RadioButtonGroup
            containerStyle={{ marginBottom: 10 }}
            selected={selectedStatus}
            size={18}
            onSelected={(value: string) => {
              if(!value) return;
              setSelectedStatus(value as 'ENABLE' | 'DISABLE');
            }}
            radioStyle={{ backgroundColor: "white"}}
            radioBackground="blue"
          >
            <RadioButtonItem 
              value="ENABLE" 
              label={<Text className='pl-2'>Bật nhận đơn</Text>} 
            />
            <View className='py-2' />
            <RadioButtonItem
              value="DISABLE"
              label={<Text className='pl-2'>Tắt nhận đơn</Text>}
            />
          </RadioButtonGroup>
          
          <View className="mt-3">
            <Button
              onPress={handleConfirm}
              className="bg-blue-500"
              label={"Xác nhận"}
            />
          </View>
        </View>
      </SBottomSheet>
    );
  }
);

export default OrderStatusBottomSheet;
