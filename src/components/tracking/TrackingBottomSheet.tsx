import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import SBottomSheet from '../SBottomSheet';
import { INJECTED_SCRIPT } from '~/src/core/utils/browser';

const { height } = Dimensions.get('window');

interface TrackingBottomSheetProps {
  title?: string;
}

export interface TrackingBottomSheetRef {
  present: (url: string) => void;
  dismiss: () => void;
}

const TrackingBottomSheet = forwardRef<TrackingBottomSheetRef, TrackingBottomSheetProps>((props, ref) => {
  const { title = 'Theo dõi đơn hàng' } = props;
  const [visible, setVisible] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string>('');
  const [, setLoading] = useState(false);
  const bottomSheetRef = useRef<any>(null);
  const webViewRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    present: (url: string) => {
      setTrackingUrl(url);
      setVisible(true);
      bottomSheetRef.current?.present();
    },
    dismiss: () => {
      setVisible(false);
      bottomSheetRef.current?.dismiss();
    }
  }));

  const handleClose = () => {
    setVisible(false);
  };

  const renderLoading = () => {
    return (
      <View className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center bg-white">
        <ActivityIndicator size="small" color="gray" />
        <Text className="mt-2 text-gray-600">Đang tải...</Text>
      </View>
    );
  };

  return (
    <SBottomSheet
      ref={bottomSheetRef}
      snapPoints={["90%"]}
      title={title}
      titleAlign="left"
      visible={visible}
      onClose={handleClose}
    >
      <View className="flex-1" style={{ height: height * 0.8 }}>
        {trackingUrl ? (
          <WebView
            ref={webViewRef}
            source={{ uri: trackingUrl }}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            injectedJavaScript={INJECTED_SCRIPT}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={renderLoading}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">Không có đường dẫn theo dõi</Text>
          </View>
        )}
      </View>
    </SBottomSheet>
  );
});

export default TrackingBottomSheet; 