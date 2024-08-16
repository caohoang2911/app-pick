import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import { Input } from '~/src/components/Input';
import { TabsStatus } from '~/src/components/orders/tab-status';
import { signOut } from '~/src/core';
import { toggleScanQrCode } from '~/src/core/store/orders';
import SearchLine from '~/src/core/svgs/SearchLine';

const Header = () => {
  return (
    <View className="px-4 py-4 bg-blue-100">
      <View className="flex flex-row justify-between items-center">
        <Text className="font-heading text-xl">Danh sách đơn hàng</Text>
        <TouchableOpacity onPress={signOut}>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          </Avatar>
        </TouchableOpacity>
      </View>
      <View className="flex flex-row mt-4 justify-between items-center gap-3">
        <Input
          className="flex-grow"
          placeholder="Mã đơn hàng, sản phẩm"
          prefix={<SearchLine width={20} height={20} />}
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
