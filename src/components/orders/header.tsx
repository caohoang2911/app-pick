import FontAwesome from '@expo/vector-icons/FontAwesome';
import { debounce } from 'lodash';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import { Input } from '~/src/components/Input';
import { TabsStatus } from '~/src/components/orders/tab-status';
import { signOut, useAuth } from '~/src/core';
import { setKeyWord, toggleScanQrCode } from '~/src/core/store/orders';
import NotificationOutline from '~/src/core/svgs/NotificationOutline';
import SearchLine from '~/src/core/svgs/SearchLine';

const Header = () => {
  const handleSearch = useCallback(
    debounce((value: string) => {
      setKeyWord(value);
    }, 400),
    []
  );

  const userInfo = useAuth.use.userInfo();
  console.log(userInfo, 'userInfo');

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
            <Text className="font-semibold text-xl">Chào {userInfo?.name}</Text>
            <Text>
              {userInfo?.id} - {userInfo.role}
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
          placeholder="Mã đơn hàng, sản phẩm"
          prefix={<SearchLine width={20} height={20} />}
          onChangeText={handleSearch}
        />
        <TouchableOpacity onPress={() => toggleScanQrCode(true)}>
          <View className=" bg-colorPrimary rounded-md size-10 flex flex-row justify-center items-center">
            <FontAwesome name="qrcode" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>
      <View className="mt-6">
        <TabsStatus />
      </View>
    </View>
  );
};

export default Header;
