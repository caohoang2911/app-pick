import Feather from '@expo/vector-icons/Feather';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { router, useGlobalSearchParams } from 'expo-router';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';

import { Linking, Pressable, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ORDER_STATUS } from '~/src/contants/order';
import { useOrderPick } from '~/src/core/store/order-pick';
import {
  BillLine,
  PrintLine,
  QRScanLine
} from '~/src/core/svgs';
import { Badge } from '../Badge';
import SBottomSheet from '../SBottomSheet';
import EmployeeSelection from '../shared/EmployeeSelection';
import { useAssignOrderToPicker } from '~/src/api/app-pick/use-assign-order-to-picker';
import { queryClient } from '~/src/api/shared/api-provider';

type Action = {
  key: string;
  title: string | React.ReactNode;
  disabled?: boolean;
  icon: React.ReactNode;
};

type Props = {};


const actions: Array<Action> = [
  {
    key: 'view-order',
    title: 'Thông tin đơn hàng',
    icon: <BillLine />,
  },
  {
    key: 'assign-order-to-picker',
    title: 'Gán đơn cho Picker',
    icon: <SimpleLineIcons name="user-follow" size={22} color="black" />,
  },
  {
    key: 'enter-bag-and-tem',
    title: 'Set kích thước & In tem',
    icon: <PrintLine />,
  },
  {
    key: 'scan-bag',
    title: 'Scan túi - Giao hàng',
    // disabled: status !== OrderStatusValue.STORE_PACKED,
    icon: <QRScanLine />,
  },
];

const OrderPickHeadeActionBottomSheet = forwardRef<any, Props>(
  ({ }, ref) => {
    const { code } = useGlobalSearchParams<{ code: string }>();
    const [visible, setVisible] = useState(false);

    const employeeSelectionRef = useRef<any>();

    const orderDetail = useOrderPick.use.orderDetail();
    const { status, picker } = orderDetail?.header || {};

    console.log('orderDetail', orderDetail);

    const { customer } = orderDetail?.header || {};
    const { name, phone, membership } = customer || {};
    const { rank } = membership || {};

    const actionRef = useRef<any>();

    const { mutate: assignOrderToPicker } = useAssignOrderToPicker(() => {
      actionRef.current?.dismiss();
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
      showMessage({
        message: 'Gán đơn cho Picker thành công',
        type: 'success',
      });
    });
  
    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => {
            actionRef.current?.present();
            setVisible(!visible);
          },
        };
      },
      []
    );

    const renderItem = ({
      onClickAction,
      key,
      title,
      icon,
      disabled,
    }: Action & { onClickAction: (key: string) => void }) => {
      return (
        <Pressable
          onPress={() => onClickAction?.(key)}
          
          disabled={false}
          style={{ opacity: disabled ? 0.5 : 1 }}
        >
          <View className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4">
            {icon}
            <Text className="text-gray-300 font-medium">{title}</Text>
          </View>
        </Pressable>
      );
    };

    const handleClickAction = (key: string) => {
      switch (key) {
        case 'view-order':
          router.push(`orders/order-invoice/${code}`);
          break;
        case 'scan-bag':
          router.push(`orders/order-scan-to-delivery/${code}`);
          break;
        case 'assign-order-to-picker':
          employeeSelectionRef.current?.present();
          break;
        case 'enter-bag-and-tem':
          if(![ORDER_STATUS.NEW, ORDER_STATUS.ASSIGNED, ORDER_STATUS.CONFIRMED, ORDER_STATUS.STORE_PICKING].includes(status as any)) {
            router.push(`orders/order-bags/${code}`);
          } else {
            showMessage({
              message: 'Đơn chưa được soạn hàng xong, không thể set kích thước & in tem',
              type: 'danger',
            });
          }
          break;
        default:
          break;
      }
      setTimeout(() => {
        actionRef.current?.dismiss();
      }, 200);
    };

    const renderExtraTitle = () => {
      return (
        <View className='flex flex-row justify-between items-center w-100 mt-2'> 
          <View className='flex flex-row gap-2 items-center'>
            <Feather name="user" size={20} color="black" />
            <Text>{name}</Text>
            {rank && <Badge label={rank} />}
          </View>
          <Pressable onPress={() => {
            Linking.openURL(`tel:${phone}`);
          }}>
            <View className='bg-blue-50 rounded-full p-3'>
              <Feather name="phone-call" size={16} color="black" />
            </View>
          </Pressable>
        </View>
      );
    };

    const handleSelectEmployee = useCallback((employee: any) => {
      console.log('employee', employee);
      assignOrderToPicker({
        pickerId: employee.id,
        orderCode: code,
      });
    }, [code]);

  
    return (
      <>
        <SBottomSheet
          visible={visible}
          title="Thao tác"
          extraTitle={renderExtraTitle()}
          ref={actionRef}
          snapPoints={[355]}
          onClose={() => {
            setVisible(false);
          }}
        >
          <View className="flex-1">
            {actions.map((action: Action) => (
              <React.Fragment key={action.key}>
                {renderItem({ ...action, onClickAction: action.disabled ? () => {} : handleClickAction, disabled: action.disabled || false })}    
              </React.Fragment>
            ))}
          </View>
        </SBottomSheet>
        
        {/* Bottom sheet chọn Picker */}
        <EmployeeSelection
          onSelect={handleSelectEmployee}
          selectedId={''}
          ref={employeeSelectionRef}
        />
      </>
    );
  }
);

export default OrderPickHeadeActionBottomSheet;
