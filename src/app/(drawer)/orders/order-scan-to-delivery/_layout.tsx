import { Stack, useLocalSearchParams } from 'expo-router';
import Header from '~/src/components/shared/Header';
import { View } from 'react-native';
import { useOrderPick } from '~/src/core/store/order-pick';
import { getScanToDeliveryInfo } from '~/src/core/utils/order';

export default function OrderScanToDeliveryLayout() {
  const { code: orderCode } = useLocalSearchParams<{ code: string }>();
  const orderDetail = useOrderPick.use.orderDetail();
  const { deliveryType, status } = orderDetail?.header || {};

  return (
    <Stack>
      <Stack.Screen
        name="[code]"
        options={{
          headerShown: true,
          header: () => (
            <View className="bg-white">
              <Header
                title={
                  getScanToDeliveryInfo({ deliveryType, status, orderCode })
                    ?.title
                }
              />
            </View>
          ),
        }}
      />
    </Stack>
  );
}
