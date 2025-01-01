import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from 'expo-router';
import { debounce, toUpper } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useAssignMeToStore } from '~/src/api/app-pick/use-assign-me-to-store';
import { useRefreshToken } from '~/src/api/auth/use-refresh-token';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import { Input } from '~/src/components/Input';
import { TabsStatus } from '~/src/components/orders/tab-status';
import { setUser, useAuth } from '~/src/core';
import { setToken } from '~/src/core/store/auth/utils';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import {
  setKeyWord,
  setOperationType,
  toggleScanQrCode,
  useOrders
} from '~/src/core/store/orders';
import ArrowDown from '~/src/core/svgs/ArrowDown';
import SearchLine from '~/src/core/svgs/SearchLine';
import { getConfigNameById } from '~/src/core/utils/config';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import OperationTypeSelection from '../shared/OperationTypeSelection';
import StoreSelection from '../shared/StoreSelection';
import DeliveryType from './delivery-type';

const windowWidth = Dimensions.get('window').width;

const Header = () => {
  const [value, setValue] = useState<string>();
  const keyword = useOrders.use.keyword();
  const operationType = useOrders.use.operationType();

  const userInfo = useAuth.use.userInfo();

  const config = useConfig.use.config();
  const stores = config?.stores || [];

  const storeRef = useRef<any>(null);
  const operationTypeRef = useRef<any>(null);
  const storeName = getConfigNameById(stores, userInfo?.storeCode);

  const { mutate: assignMeToStore } = useAssignMeToStore(() => {
    refreshToken();
  });

  const { mutate: refreshToken } = useRefreshToken((data) => {
    setLoading(true);
    setUser({
      ...userInfo,
      ...data?.data
    });
    setToken(data?.data?.zas);
  });
  

  useEffect(() => {
    setValue(keyword);
  }, [keyword]);

  const handleSearch = useCallback(
    debounce((value: string) => {
      setKeyWord(value);
    }, 400),
    []
  );

  const navigation = useNavigation()
  const toggleMenu = () => navigation.dispatch(DrawerActions.toggleDrawer())

  const handleSelectedStore = (store: Option & { address: string }) => {
    setLoading(true);
    assignMeToStore({ storeCode: store?.id });
  }
  const handleSelectedOperationType = (operationType: Option) => {
    setOperationType(operationType?.id?.toString() || "");
  }

  return (
    <View className="px-4 py-2 bg-blue-100">
      <View className="flex flex-row justify-between items-center mb-4">
        <View className="flex flex-row gap-2 items-center">
          <TouchableOpacity onPress={toggleMenu}>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            </Avatar>
          </TouchableOpacity>
          <View className="gap-1">
            <Text className="font-semibold text-lg">
              {userInfo?.name} - {toUpper(userInfo?.username)}
            </Text>
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
      <View className="flex flex-row justify-between items-center">
        <Text className="font-heading text-xl">Danh sách đơn hàng</Text>
        <TouchableOpacity onPress={() => operationTypeRef.current?.present()}>
          <View className="flex flex-row items-center gap-1">
            <Text>{stringUtils.uppercaseFirstCharacter(operationType) || 'Tất cả'}</Text>
            <ArrowDown width={20} height={20} />
          </View>
        </TouchableOpacity>
      </View>
      <View className="flex flex-row mt-4 justify-between items-center gap-3">
        <Input
          className="flex-grow"
          placeholder="Mã đơn hàng, SDT khách hàng"
          prefix={<SearchLine width={20} height={20} />}
          onChangeText={(value: string) => {
            setValue(value);
            handleSearch(value);
          }}
          value={value}
          allowClear
          onClear={() => {
            setValue('');
            setKeyWord('');
          }}
        />
        <TouchableOpacity onPress={() => toggleScanQrCode(true)}>
          <View className=" bg-colorPrimary rounded-md size-10 flex flex-row justify-center items-center">
            <FontAwesome name="qrcode" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>
      <View className="mt-4">
        <DeliveryType />
      </View>
      <TabsStatus />
      {/* Bottom sheet */}
      <StoreSelection onSelect={handleSelectedStore} ref={storeRef} selectedId={userInfo?.storeCode} />
      <OperationTypeSelection onSelect={handleSelectedOperationType} ref={operationTypeRef} selectedId={operationType} />
    </View>
  );
};

export default Header;
