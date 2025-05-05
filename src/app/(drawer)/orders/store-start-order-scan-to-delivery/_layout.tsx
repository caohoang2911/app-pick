

import { Stack } from "expo-router";
import HeaderRightAction from "~/src/components/store-start-order-scan-to-delivery/header-right-action";
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
              headerRight={<HeaderRightAction />}
            />
          )
        }} 
      />
    </Stack>
  )
}