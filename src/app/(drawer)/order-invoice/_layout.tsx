

import { Stack } from "expo-router"
import Header from "~/src/components/shared/Header"

export default function OrderInvoiceLayout() {
  return (
    <Stack>
      <Stack.Screen name="[code]" options={{ headerShown: true, header: () => <Header title="Hóa đơn" /> }} />
    </Stack>
  )
}