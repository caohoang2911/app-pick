import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
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
  renderTitle?: React.ReactNode;
  children: React.ReactNode;
  titleAlign: 'left' | 'center';
  visible: boolean;
  extraHeight?: number;
  maxSnapPoint?: string;
  onClose: () => void;
  [key: string]: any;
};

const SBottomSheet = forwardRef<any, Props>(
  (
    {
      snapPoints,
      title = 'Title',
      renderTitle,
      children,
      titleAlign = 'left',
      visible,
      extraHeight = 20,
      maxSnapPoint,
      onClose,
      ...rests
    },
    ref
  ) => {
    const bottomSheetModalRef = useRef<any>(null);
    const isKeyboardVisible = useKeyboardVisible();
    const [headerHeight, setHeaderHeight] = useState(0);
    const [height, setHeight] = useState(0);
    const [snapPointsLocal, setSnapPointsLocal] = useState([230, "70%"]);

    useEffect(() => {
      if(!snapPoints && visible && height > 0) {
        setSnapPointsLocal(maxSnapPoint ? [height + headerHeight + extraHeight, maxSnapPoint] : [height + headerHeight + extraHeight])
      }
    }, [height, visible]);

    useEffect(() => {
      if (visible) {
        bottomSheetModalRef.current?.present();
      }
      else {
        bottomSheetModalRef.current?.dismiss();
        setTimeout(() => {
          if (isKeyboardVisible) {
            Keyboard.dismiss();
          }
        }, 500);
      }
      
    }, [visible]);

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index == -1) {
         
        }
      },
      [onClose]
    );

    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => {
            bottomSheetModalRef.current?.present();
          },
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
          snapPoints={snapPointsLocal}
          onChange={handleSheetChanges}
          handleIndicatorStyle={{ display: 'none', padding: 0 }}
          key={'order-pick-action'}
          backdropComponent={renderBackdrop}
          enablePanDownToClose
          enableHandlePanningGesture
          keyboardBehavior="interactive"
          onDismiss={onClose}
          //@ts-ignore
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          {...rests}
        >
          <View 
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout
              setHeaderHeight(height);
            }}
          className="pb-4 border border-x-0 border-t-0 border-b-4 border-gray-200 flex-row items-center justify-between px-4">
            {titleAlign == 'center' && <View />}
            {!renderTitle && <Text className={`text-${titleAlign} font-semibold text-lg`}>
              {title}
            </Text>}
            {renderTitle && renderTitle}
            <Pressable
              onPress={async () => {
                if (isKeyboardVisible) {
                  Keyboard.dismiss();
                }
                setTimeout(() => {
                  onClose?.();
                  bottomSheetModalRef.current?.dismiss();
                });
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
            <BottomSheetView 
               onLayout={(event) => {
                const { height } = event.nativeEvent.layout
                setHeight(height);
              }}
            >{children}</BottomSheetView>
          </BottomSheetScrollView>
        </BottomSheetModal>
      </>
    );
  }
);

export default React.memo(SBottomSheet);
