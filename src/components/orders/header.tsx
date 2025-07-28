import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from 'expo-router';
import { toUpper } from 'lodash';
import { useRef } from 'react';
import { ActivityIndicator, Dimensions, Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useAssignMeToStore } from '~/src/api/app-pick/use-assign-me-to-store';
import { useRefreshToken } from '~/src/api/auth/use-refresh-token';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import TabsStatus from '~/src/components/orders/tab-status';
import { setUser, useAuth } from '~/src/core';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { removeItem } from '~/src/core/storage';
import { setToken, setUserInfo } from '~/src/core/store/auth/utils';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import {
  toggleScanQrCode,
  useOrders
} from '~/src/core/store/orders';
import ArrowDown from '~/src/core/svgs/ArrowDown';
import { getConfigNameById } from '~/src/core/utils/config';
import { Option } from '~/src/types/commons';
import StoreSelection from '../shared/StoreSelection';
import DeliveryType from './delivery-type';
import InputSearch from './input-search';
import { Badge } from "../Badge";

const windowWidth = Dimensions.get('window').width;

const Header = () => {
  const userInfo = useAuth.use.userInfo();

  const config = useConfig.use.config();
  const stores = config?.stores || [];
  const employeeRoles = config?.employeeRoles || [];
  const storeRef = useRef<any>(null);
  const storeName = getConfigNameById(stores, userInfo?.storeCode);
  const roleName = getConfigNameById(employeeRoles, userInfo?.role);

  const { mutate: assignMeToStore } = useAssignMeToStore(() => {
    refreshToken();
  });

  const { mutate: refreshToken, isPending } = useRefreshToken((data) => {
    setLoading(true);
    setToken(data?.data?.zas || '');
    removeItem('ip');
    setTimeout(() => {
      setUserInfo({
        ...userInfo,
        ...data?.data
      });
      setTimeout(() => {
        setUser({
          ...userInfo,
          ...data?.data
        });
        setLoading(false);
      }, 200);
    }, 1000);
  });

  const navigation = useNavigation()
  const toggleMenu = () => navigation.dispatch(DrawerActions.toggleDrawer())

  const handleSelectedStore = (store: Option & { address: string }) => {
    setLoading(true);
    assignMeToStore({ storeCode: store?.id });
  }

  return (
    <View className="py-2 bg-blue-100">
      <View className="flex px-4 flex-row justify-between items-center mb-2">
        <View className="flex flex-row gap-2 items-center">
          <TouchableOpacity onPress={toggleMenu}>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            </Avatar>
          </TouchableOpacity>
          <View className="flex-grow">
            <View className="flex flex-row items-center justify-between gap-2 flex-grow">
              <View className="flex-1 mr-2">
                <Text className="font-semibold text-lg" numberOfLines={1} ellipsizeMode="tail">
                  {userInfo?.name} - {toUpper(userInfo?.username)}
                </Text>
              </View>
              <View className="flex-shrink-0">
                <Badge label={roleName || userInfo?.role} />
              </View>
            </View>
            <Pressable
              onPress={() => storeRef.current?.present()}
              className="flex flex-row items-center gap-1">
              <Text
                className="text-sm"
                style={{ maxWidth: windowWidth - 120 }}
                numberOfLines={1}
              >
                {userInfo?.storeCode} - {storeName}
              </Text>
              <ArrowDown />
            </Pressable>
          </View>
        </View>
        {/* <Pressable onPress={() => operationTypeRef.current?.present()}>
          <NotificationOutline />
        </Pressable> */}
      </View>
      <View className="flex px-4 flex-row gap-1 items-center">
        <Text className="font-heading text-xl">Danh sách đơn hàng</Text>
        <Pressable className="flex flex-row items-center gap-1" hitSlop={10} onPress={() => refreshToken()}>
         {isPending ? <ActivityIndicator size="small" color="#4A7FFF" /> : <MaterialIcons name="refresh" size={18} color="#4A7FFF" />}
        </Pressable>
      </View>
      <View className="flex flex-row mt-2 justify-between z-10 items-center gap-3">
        <InputSearch toggleScanQrCode={() => toggleScanQrCode(true)} />
      </View> 
      <View className="px-4">
        <TabsStatus />
      </View>
      <View className="mt-2 px-4">
        <DeliveryType />
      </View>
      {/* Bottom sheet */}
      <StoreSelection onSelect={handleSelectedStore} ref={storeRef} selectedId={userInfo?.storeCode} />
    </View>
  );
};

export default Header;
