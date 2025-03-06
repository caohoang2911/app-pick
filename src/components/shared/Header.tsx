import React from 'react'
import { Text, View } from 'react-native'
import ButtonBack from '../ButtonBack'

const Header = ({
  headerLeft,
  headerRight,
  title,
}: {
  headerLeft?: React.ReactNode
  headerRight?: React.ReactNode
  title?: React.ReactNode
}) => {
  return (
    <View className="flex flex-row items-center justify-between py-3 px-2 bg-white border-b border-gray-200">
      {headerLeft || <ButtonBack />}
      {typeof title === 'string' ?  <Text className='text-lg font-medium'>{title}</Text> : title}
      {headerRight || <View />}
    </View>
  )
}

export default React.memo(Header);