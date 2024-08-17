import React, { forwardRef, useMemo } from 'react';
import { Pressable, Text } from 'react-native';

import {
  BillLine,
  CloseLine,
  EBikeLine,
  PrintLine,
  QRScanLine,
  TruckLine,
} from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';

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
  onClickAction: (key: string) => void;
  snapPoints?: any;
};

const OrderPickHeadeActionBottomSheet = forwardRef<any, Props>(
  ({ onClickAction }, ref) => {
    const snapPoints = useMemo(() => [420], []);

    const renderItem = ({
      onClickAction,
      key,
      title,
      icon,
    }: {
      key: string;
      title: string | React.ReactNode;
      icon: React.ReactNode;
      onClickAction: (key: string) => void;
    }) => {
      return (
        <Pressable
          onPress={() => onClickAction?.(key)}
          className="flex-row items-center px-4 py-3 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4"
        >
          {icon}
          <Text className="text-gray-300">{title}</Text>
        </Pressable>
      );
    };

    return (
      <SBottomSheet title="Thao tác" snapPoints={snapPoints} ref={ref}>
        {actions.map((action) => renderItem({ ...action, onClickAction }))}
      </SBottomSheet>
    );
  }
);

export default OrderPickHeadeActionBottomSheet;
