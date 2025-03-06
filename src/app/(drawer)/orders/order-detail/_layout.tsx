

import { Stack } from "expo-router";

export default function OrderInvoiceLayout() {

  return (
    <Stack>
      <Stack.Screen
        name="[code]" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  )
}