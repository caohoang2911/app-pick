import RadioButtonGroup, { RadioButtonItem } from 'expo-radio-button';
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
import { Dimensions, Keyboard, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCancelBookShipper } from '~/src/api/app-pick/use-cancel-book-shipper';
import { queryClient } from '~/src/api/shared/api-provider';
import { OrderShippingCancelReason } from '~/src/core/constants/order';
import { hideAlert } from '~/src/core/store/alert-dialog';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';

type Props = {
  orderCode: string;
};

type CancelBookShipperFormValues = {
  cancelReason: string;
  cancelDesc: string;
};

const CancelBookShipperBottomsheet = forwardRef<any, Props>(
  ({ orderCode }, ref) => {
    const [visible, setVisible] = useState(false);
    const [isOtherReasonActive, setIsOtherReasonActive] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [hasSelectedReason, setHasSelectedReason] = useState(false);
    const actionRef = useRef<any>(null);
    const submitRef = useRef<() => void>(() => {});
    const cancelDescInputRef = useRef<any>(null);

    const config = useConfig.use.config();
    const insets = useSafeAreaInsets();
    const orderShippingCancelReasons = config?.orderShippingCancelReasons || [];
    const defaultCancelReasonId = orderShippingCancelReasons[0]?.id ?? '';

    const { isPending: isLoadingCancelBookShipper, mutate: cancelBookShipper } =
      useCancelBookShipper(() => {
        hideAlert();
        setLoading(false);
        queryClient.invalidateQueries({ queryKey: ['orderDetail', orderCode] });
        actionRef.current?.dismiss();
      });

    const closeBottomSheet = useCallback(() => {
      setVisible(false);
      setIsOtherReasonActive(false);
      setHasSelectedReason(false);
      setKeyboardHeight(0);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        present: () => {
          setIsOtherReasonActive(
            defaultCancelReasonId === OrderShippingCancelReason.CANCEL_BY_OTHER,
          );
          setHasSelectedReason(Boolean(defaultCancelReasonId));
          setKeyboardHeight(0);
          setVisible(true);
        },
      }),
      [defaultCancelReasonId],
    );

    useEffect(() => {
      if (visible) {
        actionRef.current?.present();
      }
    }, [visible]);

    useEffect(() => {
      const showEvent =
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent =
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub = Keyboard.addListener(showEvent, (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        if (isOtherReasonActive) {
          setTimeout(() => {
            actionRef.current?.scrollToEnd?.({ animated: true });
          }, 50);
        }
      });
      const hideSub = Keyboard.addListener(hideEvent, () => {
        setKeyboardHeight(0);
      });

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, [isOtherReasonActive]);

    const focusCancelDescInput = useCallback(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          actionRef.current?.scrollToEnd?.({ animated: true });
          cancelDescInputRef.current?.focus();
        }, 150);
      });
    }, []);

    const validate = useCallback((values: CancelBookShipperFormValues) => {
      const errors: Partial<Record<keyof CancelBookShipperFormValues, string>> =
        {};

      if (!values.cancelReason) {
        errors.cancelReason = 'Vui lòng chọn lý do huỷ';
      }

      if (
        values.cancelReason === OrderShippingCancelReason.CANCEL_BY_OTHER &&
        !values.cancelDesc.trim()
      ) {
        errors.cancelDesc = 'Vui lòng nhập lý do huỷ';
      }

      return errors;
    }, []);

    const handleCancelShipper = useCallback(
      (values: CancelBookShipperFormValues) => {
        actionRef.current?.dismiss();
        setLoading(true);
        cancelBookShipper({
          orderCode,
          cancelReason: values.cancelReason,
          cancelDesc:
            values.cancelReason === OrderShippingCancelReason.CANCEL_BY_OTHER
              ? values.cancelDesc.trim()
              : '',
        });
      },
      [cancelBookShipper, orderCode],
    );

    const initialValues = useMemo<CancelBookShipperFormValues>(
      () => ({
        cancelReason: defaultCancelReasonId,
        cancelDesc: '',
      }),
      [defaultCancelReasonId],
    );

    const bottomSheetHeight = useMemo(() => {
      const windowHeight = Dimensions.get('window').height;
      const maxHeight = Math.floor(windowHeight * 0.92);
      const headerAndPadding = 180;
      const itemHeight = 54;
      const footerHeight = 80 + insets.bottom;
      const estimatedHeight =
        headerAndPadding +
        orderShippingCancelReasons.length * itemHeight +
        footerHeight;
      return Math.min(maxHeight, Math.max(estimatedHeight, 680));
    }, [orderShippingCancelReasons.length, insets.bottom]);

    const isKeyboardOpen = keyboardHeight > 0;

    return (
      <SBottomSheet
        visible={visible}
        title="Lý do huỷ"
        titleAlign="center"
        snapPoints={[bottomSheetHeight]}
        ref={actionRef}
        onClose={closeBottomSheet}
        extraButton={
          hasSelectedReason && !isKeyboardOpen ? (
            <Button
              loading={isLoadingCancelBookShipper}
              label="Huỷ book shipper"
              onPress={() => submitRef.current?.()}
            />
          ) : undefined
        }
      >
        <Formik
          key={visible ? 'open' : 'closed'}
          initialValues={initialValues}
          validate={validate}
          onSubmit={handleCancelShipper}
        >
          {({
            setFieldValue,
            setFieldTouched,
            handleSubmit,
            values,
            errors,
            touched,
            handleBlur,
          }) => {
            submitRef.current = handleSubmit;
            const isOtherReason =
              values.cancelReason === OrderShippingCancelReason.CANCEL_BY_OTHER;

            return (
              <View
                className="px-4 pt-4"
                style={{
                  paddingBottom: isOtherReasonActive
                    ? Math.max(keyboardHeight, 16)
                    : 16,
                }}
              >
                {orderShippingCancelReasons.length > 0 ? (
                  <RadioButtonGroup
                    containerStyle={{ marginBottom: 10 }}
                    selected={values.cancelReason}
                    size={18}
                    onSelected={(value: string) => {
                      if (!value) return;
                      setHasSelectedReason(true);
                      setFieldValue('cancelReason', value);
                      setFieldTouched('cancelReason', true, false);
                      if (value !== OrderShippingCancelReason.CANCEL_BY_OTHER) {
                        setIsOtherReasonActive(false);
                        setFieldValue('cancelDesc', '');
                        setTimeout(() => {
                          actionRef.current?.scrollToEnd?.({ animated: true });
                        }, 50);
                        return;
                      }
                      setIsOtherReasonActive(true);
                      focusCancelDescInput();
                    }}
                    radioStyle={{ backgroundColor: 'white' }}
                    radioBackground="blue"
                  >
                    {orderShippingCancelReasons.map((reason) => (
                      <RadioButtonItem
                        key={reason.id}
                        value={reason.id}
                        label={
                          <Text
                            className="pl-3 py-3 text-base"
                            style={
                              Platform.OS === 'android'
                                ? { includeFontPadding: false }
                                : undefined
                            }
                          >
                            {reason.name}
                          </Text>
                        }
                      />
                    ))}
                  </RadioButtonGroup>
                ) : (
                  <View className="py-8">
                    <Text className="text-center text-gray-500">
                      Không có lý do huỷ nào được cấu hình
                    </Text>
                  </View>
                )}

                {touched.cancelReason && errors.cancelReason ? (
                  <Text className="text-sm text-red-500 mb-2">
                    {errors.cancelReason}
                  </Text>
                ) : null}

                {isOtherReason ? (
                  <Input
                    ref={cancelDescInputRef}
                    labelClasses="font-medium w-full"
                    onChangeText={(value: string) => {
                      setFieldValue('cancelDesc', value);
                    }}
                    placeholder="Nhập lý do huỷ"
                    error={touched.cancelDesc && errors.cancelDesc}
                    name="cancelDesc"
                    value={values.cancelDesc}
                    onBlur={handleBlur('cancelDesc')}
                    onFocus={() => {
                      setTimeout(() => {
                        actionRef.current?.scrollToEnd?.({ animated: true });
                      }, 100);
                    }}
                    useBottomSheetTextInput
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                  />
                ) : null}
              </View>
            );
          }}
        </Formik>
      </SBottomSheet>
    );
  },
);

export default CancelBookShipperBottomsheet;
