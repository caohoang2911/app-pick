import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';
import SBottomSheet from '~/src/components/SBottomSheet';
import type { WorkShift } from '~/src/types/work-shift';

export type WorkShiftActionsBottomSheetRef = {
  present: (shift: WorkShift) => void;
  dismiss: () => void;
};

type Props = {
  onEdit: (shift: WorkShift) => void;
  onDelete: (shift: WorkShift) => void;
};

const WorkShiftActionsBottomSheet = forwardRef<
  WorkShiftActionsBottomSheetRef,
  Props
>(({ onEdit, onDelete }, ref) => {
  const [visible, setVisible] = useState(false);
  const [shift, setShift] = useState<WorkShift | null>(null);
  const sheetRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    present: (item) => {
      setShift(item);
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
    setShift(null);
  }, []);

  const handleEdit = useCallback(() => {
    if (!shift) return;
    sheetRef.current?.dismiss();
    onEdit(shift);
  }, [onEdit, shift]);

  const handleDelete = useCallback(() => {
    if (!shift) return;
    sheetRef.current?.dismiss();
    onDelete(shift);
  }, [onDelete, shift]);

  return (
    <SBottomSheet
      ref={sheetRef}
      visible={visible}
      title="Thao tác"
      titleAlign="center"
      snapPoints={[200]}
      onClose={handleClose}
    >
      <View className="px-4 pb-4">
        <Pressable onPress={handleEdit}>
          <View className="py-4 border-b border-gray-200">
            <Text className="text-base text-gray-900">Chỉnh sửa</Text>
          </View>
        </Pressable>
        <Pressable onPress={handleDelete}>
          <View className="py-4">
            <Text className="text-base text-red-500">Xóa ca</Text>
          </View>
        </Pressable>
      </View>
    </SBottomSheet>
  );
});

export default WorkShiftActionsBottomSheet;
