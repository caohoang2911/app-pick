import { AntDesign, MaterialIcons } from "@expo/vector-icons"
import { DrawerContentComponentProps } from "@react-navigation/drawer"
import { DrawerActions } from "@react-navigation/native"
import { router, useNavigation } from "expo-router"
import { toUpper } from "lodash"
import { Pressable, ScrollView, Text, View } from "react-native"
import { TouchableOpacity } from "react-native-gesture-handler"
import { Role } from "~/src/types/employee"
import { signOut, useAuth } from "../core"
import { useConfig } from "../core/store/config"
import { getConfigNameById } from "../core/utils/config"
import { colors } from "../ui/colors"
import { Avatar, AvatarImage } from "./Avatar"
import { VersionDisplay } from "./VersionDisplay"
import { Images } from "~/assets"



export function DrawerContent(drawerProps: DrawerContentComponentProps) {

  const userInfo = useAuth.use.userInfo();
  const navigation = useNavigation()
  const toggleMenu = () => navigation.dispatch(DrawerActions.toggleDrawer())

  const config = useConfig.use.config();
  const stores = config?.stores || [];

  const storeName = getConfigNameById(stores, userInfo?.storeCode);

  const MENU_ITEMS: { label: string, icon: React.ReactNode, onPress: () => void, enable?: boolean }[] = [
    {
      label: 'Cài đặt',
      icon: <AntDesign name="setting" size={20} color="black" />,
      onPress: () => router.push('/settings'),
      enable: true
    },
    {
      label: 'Quản lý NV',
      icon: <MaterialIcons name="manage-accounts" size={24} color="black" />,
      onPress: () => router.push('/employee'),
      enable: [Role.ADMIN, Role.STORE_MANAGER].includes(userInfo?.role as Role)
    }
  ]

  return (
    <View className="flex-1 overflow-hidden py-4">
      <View className="flex flex-row gap-2 items-center border-b border-gray-200 pb-2 px-3">
        <TouchableOpacity onPress={toggleMenu}>
          <Avatar>
            <AvatarImage source={Images.avatar_default} alt="@shadcn" />
          </Avatar>
        </TouchableOpacity>
        <View className="gap-1">
          <Text className="font-semibold text-lg">
            {userInfo?.name} - {toUpper(userInfo?.username)}
          </Text>
          <Text
            className="text-sm"
            style={{ maxWidth: 210 }}
            numberOfLines={1}
          >
            {userInfo?.storeCode} - {storeName}
          </Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {MENU_ITEMS.map((item) => (
          <Pressable onPress={item.onPress} key={item.label} disabled={!item.enable}>
            <View className={`flex flex-row gap-2 items-center border-b border-gray-200 py-3 px-3 ${!item.enable ? 'opacity-50' : ''}`}>
              {item.icon}
              <Text className="text-md font-body">{item.label}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <VersionDisplay />
      <Pressable onPress={signOut}>
        <View className="flex flex-row gap-2 items-center border-t border-gray-200 py-3 px-3 ml-3">
          <MaterialIcons name="logout" size={20} color={colors.black} />
          <Text className="text-md font-body">Logout</Text>
        </View>
      </Pressable>
    </View>
  )
}