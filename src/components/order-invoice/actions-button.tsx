import { Button } from '@/components/Button';
import React from 'react';
import { View } from 'react-native';

const ActionsButton = () => {
  return (
    <View className="border-t border-gray-200 pb-4">
      <View className="px-4 py-3 bg-white ">
        <Button
          loading={false}
          onPress={() => {}}
          disabled={false}
          label={'Đã pick xong'}
        />
      </View>
    </View>
  );
}

export default ActionsButton