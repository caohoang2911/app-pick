import { Text, View } from 'react-native';

type Props = {
  message?: string;
};

const PlaceholderScreen = ({
  message = 'Tính năng đang được phát triển',
}: Props) => (
  <View className="flex-1 items-center justify-center bg-gray-50 px-6">
    <Text className="text-center text-gray-500 text-base">{message}</Text>
  </View>
);

export default PlaceholderScreen;
