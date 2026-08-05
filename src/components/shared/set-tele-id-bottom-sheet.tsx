import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { TELEGRAM_USER_INFO_BOT_LINK } from '~/src/core/constants/telegram';
import { useKeyboardVisible } from '~/src/core/hooks/useKeyboardVisible';
import { colors } from '~/src/ui/colors';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import TelegramIdGuideModal from '../settings/telegram-id-guide-modal';

export type SetTeleIdEmployee = {
  username: string;
  name?: string;
  teleId?: string | number;
};

export type SetTeleIdBottomSheetRef = {
  present: (employee: SetTeleIdEmployee) => void;
  dismiss: () => void;
};

type Props = {
  onSubmit: (employee: SetTeleIdEmployee, teleId: string) => void;
};

// Sheet cập nhật Telegram ID cho một nhân viên. Input uncontrolled (giữ giá
// trị qua ref) để không re-render cả sheet theo từng phím gõ.
const SetTeleIdBottomSheet = forwardRef<SetTeleIdBottomSheetRef, Props>(
  ({ onSubmit }, ref) => {
    const [visible, setVisible] = useState(false);
    const [employee, setEmployee] = useState<SetTeleIdEmployee | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const sheetRef = useRef<any>(null);
    const teleIdRef = useRef('');
    const isKeyboardVisible = useKeyboardVisible();

    useImperativeHandle(ref, () => ({
      present: (item) => {
        teleIdRef.current = item.teleId != null ? String(item.teleId) : '';
        setEmployee(item);
        setVisible(true);
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
      },
    }));

    useEffect(() => {
      if (visible) {
        requestAnimationFrame(() => sheetRef.current?.present());
      }
    }, [visible]);

    const handleClose = useCallback(() => {
      setVisible(false);
      setEmployee(null);
    }, []);

    const handleSubmit = useCallback(() => {
      if (!employee) return;
      const teleId = teleIdRef.current.trim();
      if (!teleId || !/^\d+$/.test(teleId)) {
        showMessage({
          message: 'Telegram ID không hợp lệ — chỉ gồm chữ số',
          type: 'danger',
        });
        return;
      }
      sheetRef.current?.dismiss();
      onSubmit(employee, teleId);
    }, [employee, onSubmit]);

    const handleOpenTelegramBot = useCallback(async () => {
      try {
        await Linking.openURL(TELEGRAM_USER_INFO_BOT_LINK);
      } catch {
        showMessage({
          message: 'Không mở được Telegram. Thử lại sau.',
          type: 'danger',
        });
      }
    }, []);

    return (
      <>
        <SBottomSheet
          ref={sheetRef}
          visible={visible}
          title="Cập nhật Telegram ID"
          titleAlign="center"
          snapPoints={[isKeyboardVisible ? 500 : 320]}
          maintainPositionOnKeyboard={false}
          keyboardBehavior="extend"
          onClose={handleClose}
        >
          <View className="gap-3 px-4 pb-6 pt-1">
            <View>
              <Text
                numberOfLines={1}
                className="text-base font-semibold text-gray-900"
              >
                {employee?.name || employee?.username}
              </Text>
              {!!employee?.name && (
                <Text className="mt-0.5 text-sm text-gray-500">
                  Mã nhân viên: {employee?.username}
                </Text>
              )}
            </View>

            <Input
              key={employee?.username}
              label="Telegram ID"
              placeholder="Nhập Telegram ID (chỉ gồm chữ số)"
              defaultValue={
                employee?.teleId != null ? String(employee.teleId) : ''
              }
              onChangeText={(text: string) => {
                teleIdRef.current = text;
              }}
              keyboardType="number-pad"
              useBottomSheetTextInput
            />

            <TouchableOpacity
              onPress={() => setShowGuide(true)}
              hitSlop={8}
              className="flex-row items-center gap-1 self-start"
            >
              <Ionicons
                name="help-circle-outline"
                size={16}
                color={colors.blue[600]}
              />
              <Text className="text-sm font-medium text-blue-600">
                Hướng dẫn lấy Telegram ID
              </Text>
            </TouchableOpacity>

            <Button
              label="Lưu"
              labelClasses="font-semibold"
              onPress={handleSubmit}
            />
          </View>
        </SBottomSheet>

        <TelegramIdGuideModal
          visible={showGuide}
          onClose={() => setShowGuide(false)}
          onOpenTelegram={handleOpenTelegramBot}
        />
      </>
    );
  },
);

export default SetTeleIdBottomSheet;
