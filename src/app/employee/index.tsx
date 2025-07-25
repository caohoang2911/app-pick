import React from 'react'
import { View } from 'react-native'
import { Header, Employees } from '~/src/components/employee-manage'
import { setAddEmployeeModalVisible } from '~/src/core/store/employee-manage'
import { useAuth } from '~/src/core'

const EmployeeManage = () => {
  // Get user info for store code
  const userInfo = useAuth.use.userInfo();
  const { storeCode } = userInfo || {};

  const handleAddEmployeePress = () => {
    setAddEmployeeModalVisible(true);
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header 
        storeCode={storeCode || ''}
        onAddEmployeePress={handleAddEmployeePress}
      />
      <Employees />
    </View>
  )
}

export default EmployeeManage;