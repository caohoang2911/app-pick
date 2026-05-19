import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseLine } from '~/src/core/svgs';
import { SafeBottomSheetScrollView } from '~/src/core/utils/safe-scrollview';

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
  disableScrollView?: boolean; // When true, children won't be wrapped in ScrollView (useful for BottomSheetFlatList)
  /** Đóng sheet khi click vào backdrop overlay. Mặc định true. */
  closeOnBackdropPress?: boolean;
  [key: string]: any;
};

const Header = ({
  title,
  renderTitle,
  extraTitle,
  hideHeader,
  topHeader,
  titleAlign,
  bottomSheetModalRef,
  hideCloseButton,
  onClose,
}: Props) => {
  if (hideHeader) return null;

  const renderCloseButton = useMemo(() => {
    if (hideCloseButton) return null;
    return (
      <Pressable
        onPress={() => {
          requestAnimationFrame(() => {
            onClose?.();
            bottomSheetModalRef.current?.dismiss();
          });
        }}
        style={[
          !!topHeader && {
            position: 'absolute',
            right: 10,
            top: -0,
          },
        ]}
        hitSlop={15}
      >
        <CloseLine />
      </Pressable>
    );
  }, [onClose, bottomSheetModalRef, hideCloseButton]);

  return (
    <View className="pb-4 border border-x-0 border-t-0 border-b-4 border-gray-200 px-4">
      {topHeader && topHeader}
      <View className="flex flex-row justify-between items-center w-100">
        {titleAlign == 'center' && <View />}
        {!renderTitle && (
          <Text className={`text-${titleAlign} font-semibold text-lg`}>
            {title}
          </Text>
        )}
        {renderTitle && (
          <View
            className="mr-3"
            style={{ width: width - (topHeader ? 20 : 80) }}
          >
            {renderTitle}
          </View>
        )}
        {!topHeader && renderCloseButton}
      </View>
      {topHeader && renderCloseButton}
      {extraTitle && extraTitle}
    </View>
  );
};

const SBottomSheet = forwardRef<any, Props>(
  (
    {
      snapPoints = [230, '70%'],
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
      disableScrollView = false,
      hideCloseButton = false,
      closeOnBackdropPress = true,
      ...rests
    },
    ref,
  ) => {
    const bottomSheetModalRef = useRef<any>(null);
    const bottomSheetScrollViewRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

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
        scrollToEnd: (params?: { animated?: boolean }) => {
          bottomSheetScrollViewRef.current?.scrollToEnd?.({
            animated: params?.animated ?? true,
          });
        },
        scrollTo: (params: { y: number; animated?: boolean }) => {
          bottomSheetScrollViewRef.current?.scrollTo?.({
            y: params?.y,
            animated: params?.animated ?? true,
          });
        },
      }),
      [onClose],
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          enableTouchThrough={!closeOnBackdropPress}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior={
            closeOnBackdropPress && !hideCloseButton ? 'close' : 'none'
          }
        />
      ),
      [hideCloseButton, closeOnBackdropPress],
    );

    if (!visible) {
      return null;
    }

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        handleIndicatorStyle={{ display: 'none', padding: 0 }}
        // key={'order-pick-action'}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={closeOnBackdropPress && !hideCloseButton}
        enableHandlePanningGesture={closeOnBackdropPress && !hideCloseButton}
        keyboardBehavior="interactive"
        topInset={insets.top}
        onDismiss={onClose}
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        // animationConfigs={animationConfigs}
        {...rests}
      >
        <Header
          hideCloseButton={hideCloseButton}
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
        {disableScrollView ? (
          children
        ) : (
          <SafeBottomSheetScrollView
            ref={bottomSheetScrollViewRef}
            keyboardDismissMode="on-drag"
            bounces={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {children}
          </SafeBottomSheetScrollView>
        )}
        {extraButton && extraButton}
      </BottomSheetModal>
    );
  },
);

export default React.memo(SBottomSheet);
