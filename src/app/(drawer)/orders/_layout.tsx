

import { Stack } from "expo-router";

export default function OrderLayout() {

  return (
    <Stack>
      <Stack.Screen
        name="order-bags" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="print-preview" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  )
}