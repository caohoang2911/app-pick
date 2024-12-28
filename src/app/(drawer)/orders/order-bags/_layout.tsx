

import { Stack } from "expo-router";
import Header from "~/src/components/shared/Header";

export default function OrderInvoiceLayout() {
  // const isShowActionRight = status !== OrderStatusValue.SHIPPING && tags?.includes('ORDER_HOME_DELIVERY');
  const isShowActionRight = true;

  return (
    <Stack>
      <Stack.Screen
        name="[code]" 
        options={{ 
          headerShown: true,
          header: () => (
            <Header
              title="Nhập số lượng túi và in tem"
            />
          )
        }} 
      />
    </Stack>
  )
}