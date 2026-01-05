import { router, Stack } from 'expo-router';
import ButtonBack from '~/src/components/ButtonBack';
import Header from '~/src/components/shared/Header';

export default function OrderScanToDeliveryLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[code]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
