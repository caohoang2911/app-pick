import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef
} from 'react';
import { Dimensions, Platform, Pressable, Text, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { CloseLine } from '~/src/core/svgs';

const width = Dimensions.get('window').width;

type Props = {
  snapPoints?: any;
  title?: string;
  renderTitle?: React.ReactNode;
  extraTitle?: React.ReactNode;
  children: React.ReactNode;
  titleAlign: 'left' | 'center';
  visible: boolean;
  hideHeader?: boolean;
  extraButton?: React.ReactNode;
  topHeader?: React.ReactNode;
  onClose: () => void;
  [key: string]: any;
};

const Header = ({ title, renderTitle, extraTitle, hideHeader, topHeader, titleAlign, bottomSheetModalRef, onClose }: Props) => {
  if (hideHeader) return null;
  
  const renderCloseButton = useMemo(() => {
    return (
      <Pressable
        onPress={() => {
          requestAnimationFrame(() => {
            onClose?.();
            bottomSheetModalRef.current?.dismiss();
          });
        }}
        style={[!!topHeader && {
          position: 'absolute',
          right: 10,
          top: -0,
        }]}
      >
        <CloseLine />
      </Pressable>
    );
  }, [onClose, bottomSheetModalRef]);

  return (
    <View 
    className="pb-4 border border-x-0 border-t-0 border-b-4 border-gray-200 px-4"
  > 
    {topHeader && topHeader}
    <View className='flex flex-row justify-between items-center w-100'> 
      {titleAlign == 'center' && <View />}
      {!renderTitle && (
        <Text className={`text-${titleAlign} font-semibold text-lg`}>
          {title}
        </Text>
      )}
      {renderTitle && (
        <View className="mr-3" style={{ width: width - (topHeader ? 20 : 80) }}>
          {renderTitle}
        </View>
      )}
      {!topHeader && renderCloseButton}
    </View>
    {topHeader && renderCloseButton}
    {extraTitle && extraTitle}
  </View>
  )
}

const SBottomSheet = forwardRef<any, Props>(
  (
    {
      snapPoints = [230, "70%"],
      title = 'Title',
      renderTitle,
      extraTitle,
      children,
      titleAlign = 'left',
      visible,
      topHeader,
      hideHeader = false,
      extraButton,
      onClose,
      ...rests
    },
    ref
  ) => {
    const bottomSheetModalRef = useRef<any>(null);

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose?.();
        }
      },
      [onClose]
    );

    useImperativeHandle(
      ref,
      () => ({
        present: () => {
          requestAnimationFrame(() => {
            bottomSheetModalRef.current?.present();
          });
        },
        dismiss: () => {
          onClose?.();
          requestAnimationFrame(() => {
            bottomSheetModalRef.current?.dismiss();
          });
        },
      }),
      [onClose]
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

    if (!visible) {
      return null;
    }

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        handleIndicatorStyle={{ display: 'none', padding: 0 }}
        // key={'order-pick-action'}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        enableHandlePanningGesture
        keyboardBehavior="interactive"
        onDismiss={onClose}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        // animationConfigs={animationConfigs}
        {...rests}
      >
        <Header
          topHeader={topHeader}
          title={title}
          renderTitle={renderTitle}
          extraTitle={extraTitle}
          hideHeader={hideHeader}
          titleAlign={titleAlign}
          bottomSheetModalRef={bottomSheetModalRef}
          onClose={onClose} 
          children={children} 
          visible={visible}
        />
        <BottomSheetScrollView
          keyboardDismissMode="on-drag"
          bounces={true}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {children}
        </BottomSheetScrollView>
        {extraButton && extraButton}
      </BottomSheetModal>
    );
  }
);

export default React.memo(SBottomSheet);