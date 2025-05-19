
import { router, Stack, useLocalSearchParams } from "expo-router";
import ButtonBack from "~/src/components/ButtonBack";
import Header from "~/src/components/shared/Header";

export default function OrderScanToDeliveryLayout() {  
  const { code } = useLocalSearchParams<{ code: string }>();
  return (
    <Stack>
      <Stack.Screen
        name="[code]" 
        options={{ 
          headerShown: true,
          header: () => (
            <Header
              title="Siêu thị giao hàng"
              headerLeft={<ButtonBack onPress={() => router.dismiss(1)} />}
            />
          )
        }} 
      />
    </Stack>
  )
}