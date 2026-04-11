import RadioButtonGroup, { RadioButtonItem } from 'expo-radio-button';
import { useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, Text, View } from 'react-native';
import {
  BookShipperProvider,
  useBookShipper,
} from '~/src/api/app-pick/use-book-shipper';
import { hideAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { PackageSize } from '~/src/types/order';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import { queryClient } from '~/src/api/shared/api-provider';
import { useConfig } from '~/src/core/store/config';

type Props = {};

const BookShipperActionsBottomsheet = forwardRef<any, Props>(({}, ref) => {
  const [visible, setVisible] = useState(false);
  const actionRef = useRef<any>();
  const submitRef = useRef<() => void>(() => {});

  const { code } = useLocalSearchParams<{ code: string }>();

  const config = useConfig.use.config();
  // Try to find shipping providers config, if not available, use provider directly
  const shippingServiceTypes = (config as any)?.shippingServiceTypes || [];

  const { mutate: bookShipper } = useBookShipper(() => {
    hideAlert();
    queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
  });

  useImperativeHandle(ref, () => {
    return {
      present: () => {
        setVisible(!visible);
      },
    };
  }, []);

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  const handleBookShipper = (values: {
    serviceType: BookShipperProvider;
    packageSize: string;
  }) => {
    setVisible(false);
    setLoading(true);
    const extraRequest = {
      packageSize: values.packageSize,
    };

    bookShipper({
      orderCode: code ?? '',
      serviceType: values.serviceType,
      extraRequest,
    });
  };

  const shippingServiceTypesFiltered = useMemo(() => {
    return shippingServiceTypes?.filter(
      (serviceType: any) => serviceType.id !== 'STORE_EMPLOYEE',
    );
  }, [shippingServiceTypes]);

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        titleAlign="center"
        snapPoints={[550]}
        ref={actionRef}
        extraButton={
          <View className="px-4 py-4 mb-6">
            <Button
              className="mt-4"
              label="Book xe"
              onPress={() => submitRef.current?.()}
            />
          </View>
        }
        onClose={() => setVisible(false)}
      >
        <Formik
          initialValues={{
            packageSize: PackageSize.STANDARD,
            serviceType: BookShipperProvider.AHAMOVE_DRIVER,
          }}
          onSubmit={handleBookShipper}
        >
          {({ setFieldValue, handleSubmit, values }) => {
            submitRef.current = handleSubmit;
            return (
              <View className="px-4 py-4">
                <View className="flex gap-2 mb-2">
                  <View className="pt-2 mb-2">
                    <Text className="text-base font-semibold">
                      Chọn kích thước gói hàng
                    </Text>
                  </View>
                  <RadioButtonGroup
                    containerStyle={{ marginBottom: 10 }}
                    selected={values.packageSize}
                    size={18}
                    onSelected={(value: string) => {
                      if (!value) return;
                      setFieldValue('packageSize', value);
                    }}
                    radioStyle={{ backgroundColor: 'white' }}
                    radioBackground="blue"
                  >
                    <RadioButtonItem
                      value={PackageSize.STANDARD}
                      label={
                        <Text className="pl-3">
                          Thông thường (50x40x50 - 30kg - Miễn phí)
                        </Text>
                      }
                    />
                    <View className="py-3" />
                    <RadioButtonItem
                      value={PackageSize.SIZE_1}
                      label={
                        <Text className="pl-3">
                          Mức 1 (60x50x60 - 40kg - 10.000đ)
                        </Text>
                      }
                    />
                    <View className="py-3" />
                    <RadioButtonItem
                      value={PackageSize.SIZE_2}
                      label={
                        <Text className="pl-3">
                          Mức 2 (70x60x70 - 50kg - 20.000đ)
                        </Text>
                      }
                    />
                    <View className="py-3" />
                    <RadioButtonItem
                      value={PackageSize.SIZE_3}
                      label={
                        <Text className="pl-3">
                          Mức 3 (90x90x90 - 80kg - 40.000đ)
                        </Text>
                      }
                    />
                  </RadioButtonGroup>
                </View>
                {shippingServiceTypesFiltered &&
                  shippingServiceTypesFiltered?.length > 0 && (
                    <View className="flex gap-2 mb-2">
                      <View className="pt-2 mb-2">
                        <Text className="text-base font-semibold">Tài xế</Text>
                      </View>
                      <RadioButtonGroup
                        containerStyle={{ marginBottom: 10 }}
                        selected={values.serviceType}
                        size={18}
                        onSelected={(value: string) => {
                          if (!value) return;
                          setFieldValue('serviceType', value);
                        }}
                        radioStyle={{ backgroundColor: 'white' }}
                        radioBackground="blue"
                      >
                        {shippingServiceTypesFiltered?.map(
                          (serviceType: any) => (
                            <RadioButtonItem
                              key={serviceType.id}
                              value={serviceType.id}
                              label={
                                <Text
                                  className="pl-3 py-2 text-base"
                                  style={
                                    Platform.OS === 'android'
                                      ? { includeFontPadding: false }
                                      : undefined
                                  }
                                >
                                  {serviceType.name}
                                </Text>
                              }
                            />
                          ),
                        )}
                      </RadioButtonGroup>
                    </View>
                  )}
              </View>
            );
          }}
        </Formik>
      </SBottomSheet>
    </>
  );
});

export default BookShipperActionsBottomsheet;
