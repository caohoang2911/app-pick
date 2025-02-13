import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Dimensions, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { Easing } from 'react-native-reanimated';

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { CloseLine } from '~/src/core/svgs';
import { useKeyboardVisible } from '../core/hooks/useKeyboardVisible';

const width = Dimensions.get('window').width;

type Props = {
  snapPoints?: any;
  title?: string;
  renderTitle?: React.ReactNode;
  extraTitle?: React.ReactNode;
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
      extraTitle,
      children,
      titleAlign = 'left',
      visible,
      extraHeight = Platform.OS === 'ios' ? 50 : 20,
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

    const animationConfigs = useBottomSheetTimingConfigs({
      duration: 250,
      easing: Easing.linear,
    });

    useEffect(() => {
      setTimeout(() => {
        if(!snapPoints && visible && height > 0) {
          setSnapPointsLocal(maxSnapPoint ? [height + headerHeight + extraHeight, maxSnapPoint] : [height + headerHeight + extraHeight])
        } else if(snapPoints) {
          setSnapPointsLocal(snapPoints)
        }
      })
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
          animationConfigs={animationConfigs}
          {...rests}
        >
          <View 
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout
              setHeaderHeight(height);
            }}
            className="pb-4 border border-x-0 border-t-0 border-b-4 border-gray-200 px-4"
          >
            <View className='flex flex-row justify-between items-center w-100'> 
              {titleAlign == 'center' && <View />}
              {!renderTitle && <Text className={`text-${titleAlign} font-semibold text-lg`}>
                {title}
              </Text>}
              {renderTitle && <View className="mr-3" style={{ width: width - 80 }}>{renderTitle}</View>}
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
                className="self-start"
              > 
                <View style={{ marginTop: -5 }} className='p-2'>
                  <CloseLine />
                </View>
              </Pressable>
            </View>
            {extraTitle && extraTitle}
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
