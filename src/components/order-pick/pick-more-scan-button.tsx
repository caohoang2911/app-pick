import { FontAwesome } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

const PickMoreScanButton = memo(
  ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg ${disabled ? 'opacity-50' : ''}`}
    >
      <View className="bg-colorPrimary rounded-lg px-4 h-11 flex flex-row gap-1 justify-center items-center">
        <FontAwesome name="qrcode" size={14} color="white" />
        <Text className="text-white font-semibold text-sm">Pick thêm</Text>
      </View>
    </TouchableOpacity>
  ),
);

export default PickMoreScanButton;
