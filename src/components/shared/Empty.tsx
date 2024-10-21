import React from 'react';
import { View, Text } from 'react-native';

const Empty = () => {
  return (
    <View className='p-3' style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Không có dữ liệu</Text>
    </View>
  );
};

export default Empty;
