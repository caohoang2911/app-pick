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

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index == -1) {
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

    useEffect(() => {
      bottomSheetModalRef?.current?.snapToIndex(0);
    });

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
          index={0}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          handleIndicatorStyle={{ display: 'none', padding: 0 }}
          key={'order-pick-action'}
          backdropComponent={renderBackdrop}
          android_keyboardInputMode="adjustPan"
          enablePanDownToClose
          enableHandlePanningGesture
          {...rests}
        >
          <View className="pb-4 border border-x-0 border-t-0 border-b-4 border-gray-200 flex-row items-center justify-between px-4">
            {titleAlign == 'center' && <View />}
            <Text className={`text-${titleAlign} font-semibold text-lg`}>
              {title}
            </Text>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onClose?.();
                bottomSheetModalRef.current?.dismiss();
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
