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

/** Style ổn định, tránh tạo object mới mỗi render (gorhom cảnh báo unstable ref). */
const HANDLE_INDICATOR_STYLE = { display: 'none', padding: 0 } as const;

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
  /** Nút góc trái header — căn hàng với nút close khi có topHeader. */
  headerLeft?: React.ReactNode;
  onClose: () => void;
  disableScrollView?: boolean; // When true, children won't be wrapped in ScrollView (useful for BottomSheetFlatList)
  scrollViewKey?: string;
  scrollViewProps?: Record<string, any>;
  /** Đóng sheet khi click vào backdrop overlay. Mặc định true. */
  closeOnBackdropPress?: boolean;
  [key: string]: any;
};

type HeaderProps = {
  title?: string;
  renderTitle?: React.ReactNode;
  extraTitle?: React.ReactNode;
  hideHeader?: boolean;
  topHeader?: React.ReactNode;
  headerLeft?: React.ReactNode;
  titleAlign?: 'left' | 'center';
  bottomSheetModalRef: React.MutableRefObject<any>;
  hideCloseButton?: boolean;
  onClose?: () => void;
};

const HEADER_ACTION_TOP = 0;
const HEADER_ACTION_SIDE = 10;

const HeaderBase = ({
  title,
  renderTitle,
  extraTitle,
  hideHeader,
  topHeader,
  headerLeft,
  titleAlign,
  bottomSheetModalRef,
  hideCloseButton,
  onClose,
}: HeaderProps) => {
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
            right: HEADER_ACTION_SIDE,
            top: HEADER_ACTION_TOP,
            zIndex: 2,
          },
        ]}
        hitSlop={15}
      >
        <CloseLine />
      </Pressable>
    );
  }, [onClose, bottomSheetModalRef, hideCloseButton, topHeader]);

  const renderHeaderLeft = useMemo(() => {
    if (!headerLeft || !topHeader) return null;
    return (
      <View
        style={{
          position: 'absolute',
          left: HEADER_ACTION_SIDE,
          top: HEADER_ACTION_TOP,
          zIndex: 2,
        }}
        pointerEvents="box-none"
      >
        {headerLeft}
      </View>
    );
  }, [headerLeft, topHeader]);

  if (hideHeader) return null;

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
      {topHeader && renderHeaderLeft}
      {topHeader && renderCloseButton}
      {extraTitle && extraTitle}
    </View>
  );
};

const Header = React.memo(HeaderBase);

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
      headerLeft,
      hideHeader = false,
      extraButton,
      onClose,
      disableScrollView = false,
      hideCloseButton = false,
      closeOnBackdropPress = true,
      scrollViewKey,
      scrollViewProps,
      ...rests
    },
    ref,
  ) => {
    const bottomSheetModalRef = useRef<any>(null);
    const bottomSheetScrollViewRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    // Footer chuẩn cho extraButton: caller chỉ truyền nội dung nút, SBottomSheet
    // lo chrome (nền/viền/padding ngang-trên) + chừa safe-area đáy theo inset
    // (sàn 16px cho máy không notch) → layout footer đồng bộ, không mỗi màn tự bọc.
    const extraButtonStyle = useMemo(
      () => ({ paddingBottom: Math.max(insets.bottom, 16) }),
      [insets.bottom],
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
        scrollToEnd: (params?: { animated?: boolean }) => {
          const scrollView = bottomSheetScrollViewRef.current;
          if (!scrollView?.scrollToEnd) return false;
          scrollView.scrollToEnd({
            animated: params?.animated ?? true,
          });
          return true;
        },
        scrollTo: (params: { y: number; animated?: boolean }) => {
          const scrollView = bottomSheetScrollViewRef.current;
          if (!scrollView?.scrollTo) return false;
          scrollView.scrollTo({
            y: params?.y,
            animated: params?.animated ?? true,
          });
          return true;
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
        handleIndicatorStyle={HANDLE_INDICATOR_STYLE}
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
          headerLeft={headerLeft}
          title={title}
          renderTitle={renderTitle}
          extraTitle={extraTitle}
          hideHeader={hideHeader}
          titleAlign={titleAlign}
          bottomSheetModalRef={bottomSheetModalRef}
          onClose={onClose}
        />
        {disableScrollView ? (
          children
        ) : (
          <SafeBottomSheetScrollView
            key={scrollViewKey}
            ref={bottomSheetScrollViewRef}
            keyboardDismissMode="on-drag"
            bounces={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            {...scrollViewProps}
          >
            {children}
          </SafeBottomSheetScrollView>
        )}
        {extraButton && (
          <View
            className="px-4 pt-3 bg-white-500 border-t border-gray-100"
            style={extraButtonStyle}
          >
            {extraButton}
          </View>
        )}
      </BottomSheetModal>
    );
  },
);

/**
 * KHÔNG bọc React.memo ở đây: caller hầu như luôn truyền `children` là element
 * mới mỗi render nên memo không bao giờ bail out (false isolation). Muốn cô lập
 * re-render khi gõ phím thì để state ở leaf (vd SBottomSheetTextInput), đừng dựa
 * vào memo của SBottomSheet.
 */
export default SBottomSheet;
