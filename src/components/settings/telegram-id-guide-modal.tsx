import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '~/src/ui/colors';
import { Button } from '../Button';

const GUIDE_IMAGE = require('~/assets/telegram-id-guide.jpg');
// Giữ đúng tỉ lệ ảnh hướng dẫn (452x980) khi co theo bề ngang modal.
const GUIDE_IMAGE_ASPECT_RATIO = 452 / 980;

const STEPS = [
  'Bấm "Mở Telegram" để mở bot @userinfobot.',
  'Bấm Start (hoặc gửi /start) trong chat.',
  'Bot trả về dòng "Id: ..." — đó là Telegram ID của bạn.',
  'Đưa mã này cho quản lý trực tiếp.',
];

// Modal hướng dẫn lấy Telegram ID qua bot userinfobot: các bước + ảnh minh hoạ.
const TelegramIdGuideModal = ({
  visible,
  onClose,
  onOpenTelegram,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenTelegram: () => void;
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-5">
        <View
          className="w-full overflow-hidden rounded-2xl bg-white"
          style={{ maxHeight: '85%' }}
        >
          <View className="flex-row items-center justify-between border-b border-gray-200 px-4 py-3">
            <Text className="text-base font-bold text-gray-900">
              Hướng dẫn lấy Telegram ID
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.gray[500]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="gap-1.5 px-4 pt-3">
              {STEPS.map((step, index) => (
                <Text key={index} className="text-sm leading-5 text-gray-700">
                  <Text className="font-semibold text-blue-600">
                    {index + 1}.{' '}
                  </Text>
                  {step}
                </Text>
              ))}
            </View>
            <View className="mx-4 my-3 overflow-hidden rounded-xl">
              {/* width 100% + aspectRatio để ảnh co theo modal, không bị cắt */}
              <Image
                source={GUIDE_IMAGE}
                resizeMode="contain"
                style={{
                  width: '100%',
                  height: undefined,
                  aspectRatio: GUIDE_IMAGE_ASPECT_RATIO,
                }}
              />
            </View>
          </ScrollView>

          <View className="flex-row gap-2 border-t border-gray-200 p-4">
            <Button
              variant="secondary"
              className="flex-1 rounded-lg"
              labelClasses="text-sm font-semibold"
              label="Đóng"
              onPress={onClose}
            />
            <Button
              className="flex-1 rounded-lg"
              labelClasses="text-sm font-semibold"
              icon={
                <Ionicons name="paper-plane-outline" size={15} color="white" />
              }
              label="Mở Telegram"
              onPress={onOpenTelegram}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default TelegramIdGuideModal;
