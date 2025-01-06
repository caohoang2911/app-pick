import FontAwesome from '@expo/vector-icons/FontAwesome';
import { TouchableOpacity, View } from 'react-native';
import { toggleScanQrCodeProduct } from '~/src/core/store/order-scan-to-delivery';

const HeaderRightAction: React.FC<{}> = () => {
  
  return (
    <>
      <TouchableOpacity onPress={() => toggleScanQrCodeProduct(true)}>
        <View className="rounded-md w-9 h-9 flex flex-row justify-center items-center">
          <FontAwesome name="qrcode" size={24} color="black" />
        </View>
      </TouchableOpacity>
    </>
  );
};

export default HeaderRightAction;