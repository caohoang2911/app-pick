import { Formik } from 'formik';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Dimensions, View } from 'react-native';
import * as Yup from 'yup';
import { useCancelAhamoveShipper } from '~/src/api/app-pick/use-cancel-ahamove-shipper';
import { hideAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import { queryClient } from '~/src/api/shared/api-provider';

type Props = {
  orderCode: string;
};

const validationSchema = Yup.object().shape({
  cancelReason: Yup.string().required('Vui lòng nhập lý do huỷ'),
});

const CancelBookShipperBottomsheet = forwardRef<any, Props>(
  ({ orderCode }, ref) => {
    const [visible, setVisible] = useState(false);
    const actionRef = useRef<any>(null);

    const bottomSheetHeight = useMemo(() => {
      const maxHeight = Math.floor(Dimensions.get('window').height * 0.55);
      return Math.min(420, maxHeight);
    }, []);

    const closeBottomSheet = useCallback(() => {
      setVisible(false);
    }, []);

    const {
      isPending: isLoadingCancelAhamoveShipper,
      mutate: cancelAhamoveShipper,
    } = useCancelAhamoveShipper(() => {
      hideAlert();
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderCode] });
      actionRef.current?.dismiss();
    });

    useImperativeHandle(ref, () => ({
      present: () => {
        setVisible(true);
      },
    }));

    useEffect(() => {
      if (visible) {
        actionRef.current?.present();
      }
    }, [visible]);

    const handleCancelShipper = (values: { cancelReason: string }) => {
      actionRef.current?.dismiss();
      setLoading(true);
      cancelAhamoveShipper({
        ...values,
        orderCode,
      });
    };

    return (
      <SBottomSheet
        visible={visible}
        title="Lý do huỷ"
        titleAlign="center"
        snapPoints={[bottomSheetHeight]}
        ref={actionRef}
        onClose={closeBottomSheet}
      >
        <Formik
          key={visible ? 'open' : 'closed'}
          initialValues={{ cancelReason: '' }}
          validationSchema={validationSchema}
          onSubmit={handleCancelShipper}
        >
          {({
            setFieldValue,
            handleSubmit,
            values,
            errors,
            handleBlur,
            touched,
          }) => (
            <View className="px-4 py-4">
              <Input
                labelClasses="font-medium w-full"
                onChangeText={(value: string) => {
                  setFieldValue('cancelReason', value);
                }}
                placeholder="Lý do huỷ"
                error={touched.cancelReason && errors.cancelReason}
                name="cancelReason"
                value={values.cancelReason}
                onBlur={handleBlur('cancelReason')}
                useBottomSheetTextInput
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
              <Button
                loading={isLoadingCancelAhamoveShipper}
                className="mt-4"
                label="Huỷ book shipper"
                onPress={handleSubmit as () => void}
              />
            </View>
          )}
        </Formik>
      </SBottomSheet>
    );
  },
);

export default CancelBookShipperBottomsheet;
