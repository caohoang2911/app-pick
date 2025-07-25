import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import ButtonBack from '../ButtonBack'
import { AntDesign } from '@expo/vector-icons';

interface HeaderProps {
  storeCode?: string;
  onAddEmployeePress?: () => void;
}

const Header = ({ storeCode = "HCM005006", onAddEmployeePress }: HeaderProps) => {
  return (
    <View className='px-4 bg-white py-3 flex flex-row items-center justify-between'>
      <View className="flex flex-row items-center gap-2">
        <ButtonBack title={<Text className="font-semibold text-base">Quản lý nhân viên</Text>} />
      </View>
      
      <View className="flex flex-row items-center gap-3">
        <Text className="text-blue-500 font-medium">{storeCode}</Text>
        <TouchableOpacity 
          onPress={onAddEmployeePress}
          className="p-1"
        >
          <AntDesign name="adduser" size={24} color="gray" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Header;