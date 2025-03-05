

import { Stack } from "expo-router";

export default function OrderInvoiceLayout() {
  // const isShowActionRight = status !== OrderStatusValue.SHIPPING && tags?.includes('ORDER_HOME_DELIVERY');
  const isShowActionRight = true;

  return (
    <Stack>
      <Stack.Screen
        name="print-preview" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  )
}