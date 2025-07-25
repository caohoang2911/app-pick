

import { Stack } from "expo-router";

export default function OrderInvoiceLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index" 
        options={{ 
          headerShown: false
        }} 
      />
    </Stack>
  )
}