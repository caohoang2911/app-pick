

import { Drawer } from "expo-router/drawer"
import { DrawerContent } from "@/components/DrawerContent"
import { Stack } from "expo-router"

export default function DrawerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="order-detail" options={{ headerShown: false }} />
      <Stack.Screen name="order-invoice" options={{ headerShown: false }} />
    </Stack>
  )
}