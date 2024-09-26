import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { BillLine, More2Fill } from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';
const actions = [
  {
    key: 'view-invoice',
    title: 'Xem thông tin đơn hàng',
    icon: <BillLine />,
  },
];

interface MoreActionsBtnProps {
  code: string;
}

const MoreActionsBtn = ({
  code
}: MoreActionsBtnProps) => {
  const [visible, setVisible] = useState(false);

  const renderItem = useMemo(() => ({
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
        className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4"
      >
        {icon}
        <Text className="text-gray-300">{title}</Text>
      </Pressable>
    );
  }, []);

  const handleClickAction = useCallback((key: string) => {
    switch (key) {
      case 'view-invoice':
        router.push(`orders/order-invoice/${code}`);
        break;
      default:
        break;
    }
    setVisible(false);
  }, [code]);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <View className="p-2">
        <More2Fill width={20} height={20} />
        </View>
      </TouchableOpacity>
      <SBottomSheet title="Thao tác" visible={visible} onClose={() => setVisible(false)} extraHeight={80}>
        {actions.map((item) => renderItem({...item, onClickAction: handleClickAction }))}
      </SBottomSheet>
    </>
  )
}

export default MoreActionsBtn;