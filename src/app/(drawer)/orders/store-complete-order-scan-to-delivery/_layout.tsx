import { Stack } from 'expo-router';

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
