

import { Stack } from "expo-router";
import Header from "~/src/components/shared/Header";

export default function OrderScanToDeliveryLayout() {  
  return (
    <Stack>
      <Stack.Screen
        name="[code]" 
        options={{ 
          headerShown: true,
          header: () => (
            <Header
              title="Siêu thị giao hàng"
            />
          )
        }} 
      />
    </Stack>
  )
}