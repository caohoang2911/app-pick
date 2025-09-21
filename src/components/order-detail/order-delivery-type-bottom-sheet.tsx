import RadioButtonGroup, { RadioButtonItem } from 'expo-radio-button';
import { useGlobalSearchParams } from 'expo-router';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useUpdateOrderDeliveryType } from '~/src/api/app-pick/update-order-delivery-type';
import { useConfig } from '~/src/core/store/config';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import { queryClient } from '~/src/api/shared/api-provider';

interface OrderDeliveryTypeModalProps {
  setVisible: (visible: boolean) => void;
  deliveryType: string | null;
  visible: boolean;
}

export interface OrderDeliveryTypeModalRef {
  present: () => void;
}

const OrderDeliveryTypeBottomSheet = forwardRef<
  OrderDeliveryTypeModalRef,
  OrderDeliveryTypeModalProps
>(({ setVisible, visible, deliveryType }, ref) => {
  const config = useConfig.use.config();
  const orderDeliveryTypes = config?.orderDeliveryTypes || [];
  const { code } = useGlobalSearchParams<{ code: string }>();

  const { mutate: updateOrderDeliveryType } = useUpdateOrderDeliveryType({
    cbSuccess: () => {
      setVisible(false);
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
      showMessage({
        message: 'Cập nhật thành công',
        type: 'success',
      });
    },
    cbError: (error) => {
      showMessage({
        message: error,
        type: 'danger',
      });
    },
  });

  const [orderDeliveryType, setOrderDeliveryType] = useState<string | null>(
    deliveryType
  );
  const actionRef = useRef<any>();

  useEffect(() => {
    if(!visible) return;
    setOrderDeliveryType(deliveryType);
  }, [deliveryType, visible]);

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
    if (!orderDeliveryType) return;
    updateOrderDeliveryType({ type: orderDeliveryType, orderCode: code });
  };

  return (
    <SBottomSheet
      ref={actionRef}
      visible={visible}
      onClose={() => setVisible(false)}
      title="Phương thức giao hàng"
      snapPoints={[290]}
    >
      <View className="px-4 mt-2">
        {orderDeliveryTypes.length > 0 ? (
          <RadioButtonGroup
            containerStyle={{ marginBottom: 10 }}
            selected={orderDeliveryType}
            onSelected={(value: string) => {
              setOrderDeliveryType(value);
            }}
            size={18}
            radioStyle={{ backgroundColor: 'white' }}
            radioBackground="blue"
          >
            {orderDeliveryTypes?.map((deliveryType: {
              id: string;
              name: string;
            }) => (
              <RadioButtonItem
                value={String(deliveryType.id)}
                label={
                  <Text className="pl-2 py-2">
                    {deliveryType.name}
                  </Text>
                }
              />
            ))}
          </RadioButtonGroup>
        ) : (
          <View className="py-8">
            <Text className="text-center text-gray-500">
              Không có phương thức giao hàng nào được cấu hình
            </Text>
          </View>
        )}
        <View className="mt-2">
          <Button
            onPress={handleConfirm}
            className="bg-blue-500"
            label={'Xác nhận'}
          />
        </View>
      </View>
    </SBottomSheet>
  );
});

export default OrderDeliveryTypeBottomSheet;
