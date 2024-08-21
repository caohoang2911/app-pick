import FontAwesome from '@expo/vector-icons/FontAwesome';
import { debounce, set, toUpper } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import { Input } from '~/src/components/Input';
import { TabsStatus } from '~/src/components/orders/tab-status';
import { signOut, useAuth } from '~/src/core';
import {
  setKeyWord,
  toggleScanQrCode,
  useOrders,
} from '~/src/core/store/orders';
import NotificationOutline from '~/src/core/svgs/NotificationOutline';
import SearchLine from '~/src/core/svgs/SearchLine';

const windowWidth = Dimensions.get('window').width;

const Header = () => {
  const [value, setValue] = useState<string>();
  const keyword = useOrders.use.keyword();

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

  return (
    <View className="px-4 py-4 bg-blue-100">
      <View className="flex flex-row justify-between items-center mb-4">
        <View className="flex flex-row gap-2 items-center">
          <TouchableOpacity onPress={signOut}>
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
              style={{ maxWidth: windowWidth - 120 }}
              numberOfLines={1}
            >
              {userInfo?.storeCode} - {userInfo?.storeName}
            </Text>
          </View>
        </View>
        <Pressable>
          <NotificationOutline />
        </Pressable>
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
    </View>
  );
};

export default Header;
