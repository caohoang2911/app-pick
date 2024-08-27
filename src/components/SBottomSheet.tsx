import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { CloseLine } from '~/src/core/svgs';
import { useKeyboardVisible } from '../core/hooks/useKeyboardVisible';

type Props = {
  snapPoints?: any;
  title?: string;
  children: React.ReactNode;
  titleAlign: 'left' | 'center';
  onClose: () => void;
  [key: string]: any;
};

const SBottomSheet = forwardRef<any, Props>(
  (
    {
      snapPoints = ['25%', '50%'],
      title = 'Title',
      children,
      titleAlign = 'left',
      onClose,
      ...rests
    },
    ref
  ) => {
    const bottomSheetModalRef = useRef<any>(null);
    const isKeyboardVisible = useKeyboardVisible();

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index == -1 && !isKeyboardVisible) {
          onClose?.();
        }
      },
      [onClose]
    );

    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => bottomSheetModalRef.current?.present(),
          dismiss: () => {
            onClose?.();
            bottomSheetModalRef.current?.dismiss();
          },
        };
      },
      []
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      ),
      []
    );

    return (
      <>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          handleIndicatorStyle={{ display: 'none', padding: 0 }}
          key={'order-pick-action'}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
          enableHandlePanningGesture
          keyboardBehavior="interactive"
          //@ts-ignore
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          {...rests}
        >
          <View className="pb-4 border border-x-0 border-t-0 border-b-4 border-gray-200 flex-row items-center justify-between px-4">
            {titleAlign == 'center' && <View />}
            <Text className={`text-${titleAlign} font-semibold text-lg`}>
              {title}
            </Text>
            <Pressable
              onPress={async () => {
                if (isKeyboardVisible) {
                  Keyboard.dismiss();
                }
                setTimeout(() => {
                  onClose?.();
                  bottomSheetModalRef.current?.dismiss();
                }, 200);
              }}
            >
              <CloseLine />
            </Pressable>
          </View>
          <BottomSheetScrollView
            keyboardDismissMode="on-drag"
            bounces={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BottomSheetView>{children}</BottomSheetView>
          </BottomSheetScrollView>
        </BottomSheetModal>
      </>
    );
  }
);

export default SBottomSheet;
