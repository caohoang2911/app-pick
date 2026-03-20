import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { router, useGlobalSearchParams } from 'expo-router';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ORDER_STATUS } from '@/core/constants/order';
import { Linking, Pressable, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useAssignOrderToPicker } from '~/src/api/app-pick/use-assign-order-to-picker';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { queryClient } from '~/src/api/shared/api-provider';
import { BillLine, PrintLine, QRScanLine } from '~/src/core/svgs';
import {
  getScanToDeliveryInfo,
  isEnableScanToDelivery,
  isHiddenScanToDelivery,
} from '~/src/core/utils/order';
import { Badge } from '../Badge';
import SBottomSheet from '../SBottomSheet';
import EmployeeSelection from '../shared/EmployeeSelection';
import OrderActionsSubmenuBottomSheet from '../shared/order-actions-submenu-bottom-sheet';

type Action = {
  key: string;
  title: string | React.ReactNode;
  enabled?: boolean;
  icon: React.ReactNode;
  allowSubmenu?: boolean;
  hidden?: boolean;
};

type Props = {};

const OrderPickHeadeActionBottomSheet = forwardRef<any, Props>(({}, ref) => {
  const { code } = useGlobalSearchParams<{ code: string }>();
  const [visible, setVisible] = useState(false);
  const [submenuVisible, setSubmenuVisible] = useState(false);

  const employeeSelectionRef = useRef<any>();

  const { orderDetail } = useOrderDetailForCode(code);
  const header = orderDetail?.header;
  const status = header?.status;
  const deliveryType = header?.deliveryType;
  const customer = header?.customer;
  const invoiceCodeFromHeader = header?.invoiceCode;
  const { name, phone, membership } = customer || {};
  const { rank } = membership || {};

  const actionRef = useRef<any>();

  const { mutate: assignOrderToPicker } = useAssignOrderToPicker(() => {
    actionRef.current?.dismiss();
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
    showMessage({
      message: 'Gán đơn cho NV Pick thành công',
      type: 'success',
    });
  });

  useImperativeHandle(ref, () => {
    return {
      present: () => {
        actionRef.current?.present();
        setVisible(!visible);
      },
    };
  }, []);

  const renderItem = ({
    onClickAction,
    key,
    title,
    icon,
    enabled,
    allowSubmenu,
  }: Action & { onClickAction: (key: string) => void }) => {
    return (
      <Pressable
        onPress={() => onClickAction?.(key)}
        disabled={!enabled}
        style={{ opacity: enabled ? 1 : 0.5 }}
      >
        <View className="flex flex-row justify-between items-center border border-x-0 border-t-0 border-b-1 border-gray-200">
          <View className="flex-row items-center px-4 py-4  gap-4">
            {icon}
            <Text className="text-gray-300 font-medium">{title}</Text>
          </View>
          {allowSubmenu && (
            <View className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4">
              <Entypo name="chevron-small-right" size={24} color="black" />
            </View>
          )}
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
        router.push(
          getScanToDeliveryInfo({ deliveryType, status, orderCode: code })
            ?.route || '',
        );
        break;
      case 'assign-order-to-picker':
        employeeSelectionRef.current?.present();
        break;
      case 'enter-bag-and-tem':
        if (
          ![
            ORDER_STATUS.NEW,
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.CONFIRMED,
            ORDER_STATUS.STORE_PICKING,
          ].includes(status as any)
        ) {
          router.push(`orders/order-bags/${code}`);
        } else {
          showMessage({
            message:
              'Đơn chưa được soạn hàng xong, không thể set kích thước & in tem',
            type: 'danger',
          });
        }
        break;
      case 'more-actions':
        setSubmenuVisible(true);
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
      <View className="flex flex-row justify-between items-center w-100 mt-3 gap-2">
        <View className="flex flex-row gap-2 items-center flex-1 pr-10">
          <Feather name="user" size={20} color="black" />
          <Text numberOfLines={1} ellipsizeMode="tail">
            <Text className="text-gray-500">KH </Text>
            {name}
          </Text>
          {rank && <Badge label={rank} />}
        </View>
        <View className="flex flex-row gap-2 items-center">
          <Pressable
            onPress={() => {
              Linking.openURL(`tel:${phone}`);
            }}
          >
            <View className="bg-blue-50 rounded-full p-3">
              <Feather name="phone-call" size={16} color="black" />
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  const handleSelectEmployee = useCallback(
    (employee: any) => {
      assignOrderToPicker({
        pickerId: employee.id,
        orderCode: code,
      });
    },
    [code, assignOrderToPicker],
  );

  const actions: Array<Action> = useMemo(
    () => [
      {
        key: 'view-order',
        title: 'Thông tin đơn hàng',
        enabled: true,
        icon: <BillLine />,
      },
      {
        key: 'assign-order-to-picker',
        title: 'Gán đơn cho NV Pick',
        enabled: true,
        icon: <SimpleLineIcons name="user-follow" size={22} color="black" />,
      },
      {
        key: 'enter-bag-and-tem',
        title: 'Set kích thước & In tem',
        enabled: true,
        icon: <PrintLine />,
      },
      {
        key: 'scan-bag',
        title: getScanToDeliveryInfo({ deliveryType, status, orderCode: code })
          ?.title,
        enabled: isEnableScanToDelivery({ status }),
        hidden: isHiddenScanToDelivery({ deliveryType }),
        icon: <QRScanLine />,
      },
      {
        key: 'more-actions',
        title: 'Thao tác khác',
        enabled: true,
        allowSubmenu: true,
        icon: <MaterialIcons name="more-horiz" size={24} color="black" />,
      },
    ],
    [status, deliveryType, code],
  );

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        extraTitle={renderExtraTitle()}
        ref={actionRef}
        snapPoints={[415]}
        onClose={() => {
          setVisible(false);
        }}
      >
        <View className="flex-1">
          {actions
            .filter((action: Action) => !action.hidden)
            .map((action: Action) => (
              <React.Fragment key={action.key}>
                {renderItem({
                  ...action,
                  onClickAction: handleClickAction,
                  enabled: action.enabled || false,
                })}
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
      <OrderActionsSubmenuBottomSheet
        visible={submenuVisible}
        setVisible={setSubmenuVisible}
        deliveryType={deliveryType}
        orderCode={code}
        status={status}
        invoiceCode={invoiceCodeFromHeader}
      />
    </>
  );
});

export default OrderPickHeadeActionBottomSheet;
