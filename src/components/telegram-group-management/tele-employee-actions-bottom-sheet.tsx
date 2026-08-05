import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';
import type { TeleMentionedEmployee } from '~/src/api/app-pick/use-get-my-store-detail';
import SBottomSheet from '~/src/components/SBottomSheet';

export type TeleEmployeeActionsBottomSheetRef = {
  present: (employee: TeleMentionedEmployee) => void;
  dismiss: () => void;
};

type Props = {
  onSetTeleId: (employee: TeleMentionedEmployee) => void;
  onRemove: (employee: TeleMentionedEmployee) => void;
};

// Menu ⋮ của một nhân viên trong danh sách mention nhóm Tele.
const TeleEmployeeActionsBottomSheet = forwardRef<
  TeleEmployeeActionsBottomSheetRef,
  Props
>(({ onSetTeleId, onRemove }, ref) => {
  const [visible, setVisible] = useState(false);
  const [employee, setEmployee] = useState<TeleMentionedEmployee | null>(null);
  const sheetRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    present: (item) => {
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

  const handleSetTeleId = useCallback(() => {
    if (!employee) return;
    sheetRef.current?.dismiss();
    onSetTeleId(employee);
  }, [employee, onSetTeleId]);

  const handleRemove = useCallback(() => {
    if (!employee) return;
    sheetRef.current?.dismiss();
    onRemove(employee);
  }, [employee, onRemove]);

  return (
    <SBottomSheet
      ref={sheetRef}
      visible={visible}
      title={employee?.name || employee?.username || 'Thao tác'}
      titleAlign="center"
      snapPoints={[200]}
      onClose={handleClose}
    >
      <View className="px-4 pb-4">
        <Pressable onPress={handleSetTeleId}>
          <View className="border-b border-gray-200 py-4">
            <Text className="text-base text-gray-900">
              Cập nhật Telegram ID
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={handleRemove}>
          <View className="py-4">
            <Text className="text-base text-red-500">
              Xoá khỏi danh sách nhận thông báo
            </Text>
          </View>
        </Pressable>
      </View>
    </SBottomSheet>
  );
});

export default TeleEmployeeActionsBottomSheet;
