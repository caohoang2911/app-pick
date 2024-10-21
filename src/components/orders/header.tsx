import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from 'expo-router';
import { debounce, toUpper } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSetStorePicking } from '~/src/api/app-pick/use-set-sore-picking';
import { queryClient } from '~/src/api/shared';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import { Input } from '~/src/components/Input';
import { TabsStatus } from '~/src/components/orders/tab-status';
import { setUser, useAuth } from '~/src/core';
import { setLoading } from '~/src/core/store/loading';
import {
  setKeyWord,
  toggleScanQrCode,
  useOrders,
} from '~/src/core/store/orders';
import ArrowDown from '~/src/core/svgs/ArrowDown';
import SearchLine from '~/src/core/svgs/SearchLine';
import { Option } from '~/src/types/commons';
import StoreSelection from '../shared/StoreSelection';

const windowWidth = Dimensions.get('window').width;

const Header = () => {
  const [value, setValue] = useState<string>();
  const keyword = useOrders.use.keyword();

  const [currentStore, setCurrentStore] = useState<Option & { address: string }>();

  const storeRef = useRef<any>(null);

  const { mutate: setStorePicking } = useSetStorePicking(() => {
    queryClient.resetQueries();
    setUser({
      ...userInfo,
      storeCode: currentStore?.id ? String(currentStore.id) : '',
      storeName: currentStore?.name || '',
    });
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

  const userInfo = useAuth.use.userInfo();

  const navigation = useNavigation()
  const toggleMenu = () => navigation.dispatch(DrawerActions.toggleDrawer())

  const handleSelectedStore = (store: Option & { address: string }) => {
    setLoading(true);
    setStorePicking({ storeCode: store.id });
    setCurrentStore(store);
  }

  return (
    <View className="px-4 py-4 bg-blue-100">
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
            <Pressable onPress={() => storeRef.current?.present()} className="flex flex-row items-center gap-1">
              <Text
                className="text-sm"
                style={{ maxWidth: windowWidth - 120 }}
                numberOfLines={1}
              >
                {userInfo?.storeCode} - {userInfo?.storeName}
              </Text>
              <ArrowDown />
            </Pressable>
          </View>
        </View>
        {/* <Pressable>
          <NotificationOutline />
        </Pressable> */}
      </View>
      <Text className="font-heading text-xl">Danh sách đơn hàng</Text>
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
      <TabsStatus />
      
      <StoreSelection onSelect={handleSelectedStore} ref={storeRef} selectedId={userInfo?.storeCode} />
    </View>
  );
};

export default Header;
