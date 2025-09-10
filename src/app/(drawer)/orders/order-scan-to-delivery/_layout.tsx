

import { Stack } from "expo-router";
import HeaderRightAction from "~/src/components/order-scan-to-delivery/header-right-action";
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
              title={`Scan túi - Giao hàng`}
            />
          )
        }} 
      />
    </Stack>
  )
}