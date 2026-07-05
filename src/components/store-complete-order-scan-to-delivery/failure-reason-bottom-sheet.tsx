import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, View } from 'react-native';
import { useValidateDeliveryOrderFail } from '~/src/api/app-pick/use-validate-delivery-order-fail';
import { Button } from '~/src/components/Button';
import SBottomSheet from '~/src/components/SBottomSheet';
import SBottomSheetTextInput, {
  SBottomSheetTextInputHandle,
} from '~/src/components/SBottomSheetTextInput';
import { setLoading } from '~/src/core/store/loading';

const FAILURE_BOTTOM_SHEET_HEIGHT = Math.min(
  320,
  Math.floor(Dimensions.get('window').height * 0.55),
);
const FAILURE_SNAP_POINTS = [FAILURE_BOTTOM_SHEET_HEIGHT];

/** Style ổn định cho ô nhập (tránh tạo object mới mỗi render → churn native input). */
const FAILURE_INPUT_STYLE = {
  minHeight: 100,
  textAlignVertical: 'top',
} as const;

const validateReason = (value: string) =>
  value.trim() ? undefined : 'Vui lòng nhập lý do giao hàng thất bại';

type Props = {
  visible: boolean;
  orderCode: string;
  segments: string[];
  onClose: () => void;
};

/**
 * Bottom sheet nhập lý do giao hàng thất bại.
 *
 * State ô nhập nằm TRONG `SBottomSheetTextInput` (leaf). Gõ phím → chỉ leaf
 * re-render, SBottomSheet và component này KHÔNG re-render. Value đọc qua
 * `reasonInputRef.getValue()` và validate qua `reasonInputRef.validate()` lúc
 * submit.
 */
const FailureReasonBottomSheet = React.memo(
  ({ visible, orderCode, segments, onClose }: Props) => {
    const bottomSheetRef = useRef<any>(null);
    const reasonInputRef = useRef<SBottomSheetTextInputHandle>(null);

    const { mutate: validateDeliveryOrderFail, isPending: isLoading } =
      useValidateDeliveryOrderFail(() => {
        setLoading(false);
        const currentPath = segments.join('/');
        if (currentPath.includes('store-start-order-scan-to-delivery')) {
          router.dismiss(2);
        } else {
          router.back();
        }
      });

    useEffect(() => {
      if (visible) {
        reasonInputRef.current?.reset();
        bottomSheetRef.current?.present();
      }
    }, [visible]);

    const handleClose = useCallback(() => {
      onClose();
    }, [onClose]);

    const handleSubmit = useCallback(() => {
      // validate() hiện lỗi đỏ ngay dưới ô (state ở leaf) nếu rỗng → không submit.
      if (!reasonInputRef.current?.validate()) return;
      const reason = reasonInputRef.current?.getValue() ?? '';
      bottomSheetRef.current?.dismiss();
      validateDeliveryOrderFail({ orderCode, reason });
    }, [orderCode, validateDeliveryOrderFail]);

    if (!visible) return null;

    return (
      <SBottomSheet
        visible={visible}
        ref={bottomSheetRef}
        title="Lý do giao hàng thất bại"
        onClose={handleClose}
        snapPoints={FAILURE_SNAP_POINTS}
        extraButton={
          <View className="px-4 pt-3 pb-6 bg-white flex-row gap-3">
            <Button
              label="Hủy"
              onPress={() => bottomSheetRef.current?.dismiss()}
              variant="secondary"
              className="flex-1"
            />
            <Button
              label="Xác nhận"
              onPress={handleSubmit}
              loading={isLoading}
              className="flex-1"
            />
          </View>
        }
      >
        <View className="px-4 py-4">
          <SBottomSheetTextInput
            ref={reasonInputRef}
            placeholder="Nhập lý do giao hàng thất bại..."
            validate={validateReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={FAILURE_INPUT_STYLE}
          />
        </View>
      </SBottomSheet>
    );
  },
);

export default FailureReasonBottomSheet;
