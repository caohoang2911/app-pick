import { isEmpty } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetConfig } from '~/src/api/config/use-get-config';
import { useConfig } from '~/src/core/store/config';
import { StoreLine } from '~/src/core/svgs';
import { Button } from '../Button';
import StoreSelection from './store-selection';
import { setLoading } from '~/src/core/store/loading';

interface Props {
  code?: string | null;
}

const Step = ({ index, text }: { index: number; text: string }) => (
  <View className="flex-row items-center gap-3">
    <View className="w-7 h-7 rounded-full bg-blue-50 items-center justify-center">
      <Text className="text-blue-600 font-bold text-xs">{index}</Text>
    </View>
    <Text className="flex-1 text-gray-700 text-sm">{text}</Text>
  </View>
);

const RequestPermissionStore = ({ code }: Props) => {
  const ref = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const version = useConfig.use.version();
  const config = useConfig.use.config();

  const { refetch, isFetching } = useGetConfig({
    localVersion: version,
  });

  const handleRequestPermission = () => {
    ref.current.present();
  };

  useEffect(() => {
    if (isEmpty(config)) {
      refetch();
    }
  }, [config]);

  useEffect(() => {
    setLoading(isFetching);
  }, [isFetching]);

  if (isFetching) return null;

  return (
    <View className="flex-1 bg-white px-6">
      <View className="flex-1 items-center justify-center">
        {/* Icon minh hoạ */}
        <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6">
          <StoreLine width={46} height={46} />
        </View>

        {/* Tiêu đề */}
        <Text className="mb-2 text-center text-xl font-bold text-gray-900">
          Chưa được gán siêu thị
        </Text>

        {/* Mô tả */}
        <Text className="mb-8 text-center text-base leading-6 text-gray-500">
          Tài khoản của bạn chưa thuộc siêu thị nào. Làm theo các bước sau để
          được cấp quyền sử dụng app:
        </Text>

        {/* Các bước */}
        <View className="w-full gap-4">
          <Step index={1} text="Chọn siêu thị bạn sẽ làm việc" />
          <Step
            index={2}
            text="Chọn siêu thị để yêu cầu cấp quyền cho quản lý"
          />
          <Step index={3} text="Đợi duyệt và đăng nhập lại để bắt đầu" />
        </View>
      </View>

      {/* Nút hành động — ghim đáy, tôn trọng safe-area */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button
          label="Yêu cầu cấp quyền siêu thị"
          size="md"
          className="w-full h-12"
          onPress={handleRequestPermission}
        />
      </View>

      <StoreSelection
        ref={ref}
        onSelect={() => {}}
        selectedId={''}
        code={code}
        newbie={true}
      />
    </View>
  );
};

export default RequestPermissionStore;
