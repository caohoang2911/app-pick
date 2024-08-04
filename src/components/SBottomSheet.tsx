import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  BottomSheetScrollView,
  BottomSheetModal,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import {
  BillLine,
  CloseLine,
  EBikeLine,
  PrintLine,
  QRScanLine,
  TruckLine,
} from '~/src/core/svgs';

const actions = [
  {
    key: 'view-order',
    title: 'Xem thông tin đơn hàng',
    icon: <BillLine />,
  },
  {
    key: 'enter-bag-and-tem',
    title: 'Nhập số lượng túi và in tem',
    icon: <PrintLine />,
  },
  {
    key: 'scan-bag-customer',
    title: 'Scan túi - Giao cho khách',
    icon: <QRScanLine />,
  },
  {
    key: 'scan-bag-shipper',
    title: 'Scan túi - Giao cho shipper',
    icon: <QRScanLine />,
  },
  {
    key: 'store-shipping',
    title: 'Store giao hàng',
    icon: <TruckLine />,
  },
  {
    key: 'book-ahamove',
    title: 'Book Ahamove',
    icon: <EBikeLine />,
  },
  {
    key: 'cancel-order',
    title: <Text className="text-red-500">Huỷ đơn</Text>,
    icon: <CloseLine color={'#E53E3E'} />,
  },
];

type Props = {
  snapPoints?: any;
  title?: string;
  children: React.ReactNode;
};

const SBottomSheet = forwardRef<any, Props>(
  ({ snapPoints = ['25%', '50%'], title = 'Title', children }, ref) => {
    const bottomSheetModalRef = useRef<any>(null);

    const handleSheetChanges = useCallback((index: number) => {
      console.log('handleSheetChanges', index);
    }, []);

    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => bottomSheetModalRef.current?.present(),
          dismiss: () => bottomSheetModalRef.current?.dismiss(),
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
        <View className="flex-1">
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            handleIndicatorStyle={{ display: 'none', padding: 0 }}
            key={'order-pick-action'}
            backdropComponent={renderBackdrop}
            enableOverDrag
            enableHandlePanningGesture
          >
            <View className="pb-4 border border-x-0 border-t-0 border-b-4 border-gray-200 flex-row items-center justify-between px-4">
              <View />
              <Text className="text-center font-semibold text-lg">{title}</Text>
              <Pressable onPress={() => bottomSheetModalRef.current?.dismiss()}>
                <CloseLine />
              </Pressable>
            </View>
            <BottomSheetScrollView>{children}</BottomSheetScrollView>
          </BottomSheetModal>
        </View>
      </>
    );
  }
);

export default SBottomSheet;
