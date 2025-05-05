

import { Stack } from "expo-router";

export default function OrdersLayout() {

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="order-invoice" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="order-bags" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="order-detail" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="order-scan-to-delivery" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="store-start-order-scan-to-delivery" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen
        name="store-complete-order-scan-to-delivery" 
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