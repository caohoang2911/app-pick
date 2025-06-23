import { Formik } from 'formik';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import * as Yup from 'yup';
import { useCancelAhamoveShipper } from '~/src/api/app-pick/use-cancel-ahamove-shipper';
import { hideAlert } from "~/src/core/store/alert-dialog";
import { setLoading } from '~/src/core/store/loading';
import { Button } from '../Button';
import { Input } from "../Input";
import SBottomSheet from '../SBottomSheet';
import { queryClient } from '~/src/api/shared/api-provider';

type Props = {
  orderCode: string;
};

const CancelBookShipperBottomsheet = forwardRef<any, Props>(({ orderCode }, ref) => {
  const [visible, setVisible] = useState(false);
  const actionRef = useRef<any>();

    // Huỷ book shipper
    const { isPending: isLoadingCancelAhamoveShipper, mutate: cancelAhamoveShipper } = useCancelAhamoveShipper(() => {
      hideAlert();
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: ['orderDetail', orderCode] });
      actionRef.current?.dismiss();
    });
  
  useImperativeHandle(
    ref,
    () => {
      return {
        present: () => {
  
          setVisible(!visible);
        },
      };
    },
    []
  );

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  const handleCancelShipper = (values: any) => {
    setVisible(false);
    setLoading(true);
    cancelAhamoveShipper({
      ...values,
      orderCode,
    });
  }

  // Thêm validation schema
  const validationSchema = Yup.object().shape({
    cancelReason: Yup.string()
      .required('Vui lòng nhập lý do huỷ')
  });

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Lý do huỷ"
        titleAlign="center"
        snapPoints={[260]}
        ref={actionRef}
        onClose={() => setVisible(false)}
      >
        <Formik 
          initialValues={{
            cancelReason: ''
          }} 
          validationSchema={validationSchema}
          onSubmit={handleCancelShipper}
        >
          {({ setFieldValue, handleSubmit, values, errors, handleBlur, touched }) => (
            <View className='px-4 py-4'>
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
                defaultValue=""
                useBottomSheetTextInput
                multiline={true}
                numberOfLines={4}
                style={{ 
                  height: 60,
                  textAlignVertical: 'top'
                }}
                textAlignVertical="top" 
              />
              <Button 
                loading={isLoadingCancelAhamoveShipper} 
                className='mt-4' 
                label='Huỷ book shipper' 
                onPress={handleSubmit as any} 
              />
            </View>
          )}
        </Formik>
      </SBottomSheet>
    </>
  );
});

export default CancelBookShipperBottomsheet;