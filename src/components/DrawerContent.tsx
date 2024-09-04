import { MaterialIcons } from "@expo/vector-icons"
import { DrawerContentComponentProps } from "@react-navigation/drawer"
import { DrawerActions } from "@react-navigation/native"
import { useNavigation } from "expo-router"
import { toUpper } from "lodash"
import { Pressable, ScrollView, Text, View } from "react-native"
import { TouchableOpacity } from "react-native-gesture-handler"
import { signOut, useAuth } from "../core"
import { colors } from "../ui/colors"
import { Avatar, AvatarImage } from "./Avatar"

export function DrawerContent(drawerProps: DrawerContentComponentProps) {

  const userInfo = useAuth.use.userInfo();
  const navigation = useNavigation()
  const toggleMenu = () => navigation.dispatch(DrawerActions.toggleDrawer())

  return (
    <View className="flex-1 overflow-hidden py-4">
      <View className="flex flex-row gap-2 items-center border-b border-gray-200 pb-2 px-3">
        <TouchableOpacity onPress={toggleMenu}>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          </Avatar>
        </TouchableOpacity>
        <View className="gap-1">
          <Text className="font-semibold text-lg">
            {userInfo?.name} - {toUpper(userInfo?.email)}
          </Text>
          <Text
            className="text-sm"
            style={{ maxWidth: 200 }}
            numberOfLines={1}
          >
            {userInfo?.storeCode} - {userInfo?.storeName}
          </Text>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={signOut}>
          <View className="flex flex-row gap-2 items-center border-b border-gray-200 py-3 px-3">
            <MaterialIcons name="logout" size={20} color={colors.black} />
            <Text className="text-md font-body">Logout</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  )
}