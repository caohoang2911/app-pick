import { Stack, useLocalSearchParams } from 'expo-router';
import Header from '~/src/components/shared/Header';
import HeaderRightAction from '~/src/components/store-start-order-scan-to-delivery/header-right-action';

export default function OrderScanToDeliveryLayout() {
  const { code } = useLocalSearchParams<{ code: string }>();

  return (
    <Stack>
      <Stack.Screen
        name="[code]"
        options={{
          headerShown: true,
          header: () => (
            <Header title={''} headerRight={<HeaderRightAction />} />
          ),
        }}
      />
    </Stack>
  );
}
