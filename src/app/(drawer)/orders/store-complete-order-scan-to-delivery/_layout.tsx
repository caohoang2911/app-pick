import { router, Stack, useLocalSearchParams } from 'expo-router';
import ButtonBack from '~/src/components/ButtonBack';
import Header from '~/src/components/shared/Header';
import { getScanToDeliveryInfo } from '~/src/core/utils/order';
import { useOrderPick } from '~/src/core/store/order-pick';

export default function OrderScanToDeliveryLayout() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const orderDetail = useOrderPick.use.orderDetail();
  const { deliveryType, status } = orderDetail?.header || {};
  const title = getScanToDeliveryInfo({
    deliveryType,
    status,
    orderCode: code,
  })?.title;

  return (
    <Stack>
      <Stack.Screen
        name="[code]"
        options={{
          headerShown: true,
          header: () => (
            <Header
              title={title}
              headerLeft={<ButtonBack onPress={() => router.dismiss(1)} />}
            />
          ),
        }}
      />
    </Stack>
  );
}
