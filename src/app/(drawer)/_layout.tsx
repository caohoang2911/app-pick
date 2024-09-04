import { Drawer } from "expo-router/drawer"
import { DrawerContent } from "@/components/DrawerContent"

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{ headerShown: false, drawerStyle: { width: "75%" } }}
      drawerContent={(props) => <DrawerContent {...props} />}
    />
  )
}