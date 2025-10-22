import { Stack } from 'expo-router';
import Header from '~/src/components/shared/Header';
import { View } from 'react-native';

export default function OrderScanToDeliveryLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[code]"
        options={{
          headerShown: true,
          header: () => <View className="px-4 bg-white"><Header title={`Scan túi - Giao hàng`} /></View>,
        }}
      />
    </Stack>
  )
}
