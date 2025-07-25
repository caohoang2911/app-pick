import AntDesign from '@expo/vector-icons/AntDesign';
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useUpdateShippingPackageSize } from "~/src/api/app-pick/use-update-shipping-package-size";
import { queryClient } from "~/src/api/shared/api-provider";
import { setLoading } from "~/src/core/store/loading";
import { useOrderPick } from "~/src/core/store/order-pick";
import { OrderStatusValue, PackageSize, PackageSizeLabel } from "~/src/types/order";

import React from "react";
import { CheckCircleFill } from "~/src/core/svgs";
import { OrderDetailHeader } from "~/src/types/order-detail";
import Box from "../Box";
import SBottomSheet from "../SBottomSheet";

const EDITABLE_STATUSES = [
  OrderStatusValue.STORE_PICKING,
  OrderStatusValue.STORE_PACKED,
];

interface PackageSizePickerProps {
}

interface Action {
  key?: string;
  title: string;
  active: boolean;
}

export const PackageSizePicker: FC<PackageSizePickerProps> = ({  }) => {
  const [visible, setVisible] = useState(false);
  const orderDetail = useOrderPick.use.orderDetail();

  const header = orderDetail?.header;

  const { shipping, status, isRequireSelectShippingPackageSize } = header as OrderDetailHeader;
  const actionRef = useRef<BottomSheetModal>(null);

  const { code: orderCode } = useLocalSearchParams<{ code: string }>();

  const { mutate: updateShippingPackageSize} = useUpdateShippingPackageSize(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
    setVisible(false);
  });


  const actions: Array<Action> = useMemo(() => [
    {
      key: PackageSize.STANDARD,
      title: PackageSizeLabel.STANDARD,
      active: (!isRequireSelectShippingPackageSize && shipping?.packageSize === PackageSize.STANDARD) || false,
    },
    {
      key: PackageSize.SIZE_1,
      title: PackageSizeLabel.SIZE_1,
      active: shipping?.packageSize === PackageSize.SIZE_1,
    },
    {
      key: PackageSize.SIZE_2,
      title: PackageSizeLabel.SIZE_2,
      active: shipping?.packageSize === PackageSize.SIZE_2,
    },
    {
      key: PackageSize.SIZE_3,
      title: PackageSizeLabel.SIZE_3,
      active: shipping?.packageSize === PackageSize.SIZE_3,
    },
  ], [shipping?.packageSize, isRequireSelectShippingPackageSize]);

  const renderItem = ({
    onClickAction,
    key,
    title,
    active,
  }: Action & { onClickAction: (key: string) => void, active: boolean }) => {
    return (
      <Pressable
        onPress={() => {
          if(active) return;
          onClickAction?.(key || '')
        }}
        className="flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-2"
      >
        <View className="flex-row items-center gap-2">
          <Text className="font-medium">{title}</Text>
          {active && <CheckCircleFill width={15} height={15} color={"green"} />}
        </View>
      </Pressable>
    );
  };

  const handleSelectPackageSize = (value: string) => {    
    setLoading(true);
    updateShippingPackageSize({ size: value as PackageSize, orderCode });
  };
  
  const isEditPackageSize = true || EDITABLE_STATUSES.includes(status as OrderStatusValue);

  const handleOpenBottomSheet = () => {
    if(isEditPackageSize) {
      setVisible(true);
    }
  };

  useEffect(() => {
    if(visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Chọn kích thước gói hàng" 
        ref={actionRef}
        snapPoints={[310]}
        onClose={() => setVisible(false)}
      >
        {actions.map((action: Action) => (
          <React.Fragment key={action.key}>
            {renderItem({ ...action, onClickAction: handleSelectPackageSize })}
          </React.Fragment>
        ))}
      </SBottomSheet>
      <Pressable onPress={() => handleOpenBottomSheet()}>
        <Box className="flex-row items-center justify-between">
          <View className="">
            <Text 
              className={`font-bold text-base  ${isRequireSelectShippingPackageSize && `text-orange-500`}`}>Kích thước gói hàng</Text>
            <Text className="text-gray-300 font-bold text-xs">
              {shipping?.packageSize && !isRequireSelectShippingPackageSize ? PackageSizeLabel[shipping.packageSize as keyof typeof PackageSizeLabel] : 'Vui lòng chọn'}</Text>
          </View>
          {isEditPackageSize && <AntDesign name="right" size={18} color="black" />}
        </Box>
      </Pressable>
    </>
  );
};
