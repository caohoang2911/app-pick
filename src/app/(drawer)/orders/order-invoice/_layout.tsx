

import { Stack } from "expo-router";
import HeaderInvoice from "~/src/components/order-invoice/header";

export default function OrderInvoiceLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[code]" 
        options={{ 
          headerShown: true,
          header: () => (
            <HeaderInvoice />
          )
        }} 
      />
    </Stack>
  )
}