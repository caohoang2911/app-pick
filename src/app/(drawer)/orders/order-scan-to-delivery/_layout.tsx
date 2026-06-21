import { Stack } from 'expo-router';
import { View } from 'react-native';
import Header from '~/src/components/shared/header';

export default function OrderScanToDeliveryLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[code]"
        options={{
          headerShown: true,
          header: () => (
            <View className="bg-white">
              <Header title={''} />
            </View>
          ),
        }}
      />
    </Stack>
  );
}
