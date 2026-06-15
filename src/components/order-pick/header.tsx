import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useGlobalSearchParams } from 'expo-router';
import { toLower } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { isDevelopment } from '~/src/core/env';
import {
  setIsEditManual,
  setKeyword,
  setSuccessForBarcodeScan,
  toggleScanQrCodeProduct,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import { getRelativeTime } from '~/src/core/utils/moment';
import { Employee } from '~/src/types/employee';
import { OrderDetail } from '~/src/types/order-pick';
import { Product, ProductItemGroup } from '~/src/types/product';
import { Badge } from '../Badge';
import { Input } from '../Input';
import CopyButton from '../shared/copy-button';
import LabelTags from '../shared/LabelTags';
import WaveButton from '../shared/WaveButton';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';

const Picker = ({ picker }: { picker: { username: string; name: string } }) => {
  if (!picker) return null;
  const orderPickProductsFlat = useOrderPickProductsFlat();

  const totalPickedDone = useMemo(() => {
    return orderPickProductsFlat?.filter(
      (bag: Product | ProductItemGroup) => (bag as Product).pickedTime,
    )?.length;
  }, [orderPickProductsFlat]);

  return (
    <View className="flex flex-row items-center justify-between mt-2">
      <View className="flex flex-row items-center">
        <Feather name="package" size={18} color="gray" />
        <View className="flex flex-row gap-1 items-center ml-2 max-w-[80%]">
          <Text className="text-sm text-gray-500">Picker</Text>
          <Text className="text-sm" numberOfLines={1} ellipsizeMode="tail">
            {picker?.name} - {picker?.username}
          </Text>
        </View>
      </View>
      <View className="flex flex-row gap-1 items-center">
        <Badge
          label={`Pick ${totalPickedDone || 0}/${orderPickProductsFlat?.length || 0}`}
          variant="default"
        />
      </View>
    </View>
  );
};
type Props = {
  onClickHeaderAction?: () => void;
};

const OrderPickHeader = ({ onClickHeaderAction }: Props) => {
  const keyword = useOrderPick.use.keyword();
  const { code } = useGlobalSearchParams<{ code: string }>();
  const [value, setValue] = useState<string>();
  const disabled = useCanEditOrderPick(code as string);

  useEffect(() => {
    setValue(keyword);
  }, [keyword]);

  useEffect(() => {
    setKeyword('');

    return () => {
      setKeyword('');
    };
  }, [code]);

  const handleSearch = useCallback((value: string) => {
    setKeyword(value);
  }, []);

  const { orderDetail } = useOrderDetailForCode(code);
  const { header } = orderDetail;
  const { status, statusName, lastTimeUpdateStatus, tags, picker } =
    header || {};

  const shouldDisplayQrScan = useCanEditOrderPick(code as string);
  const barcodeKeyboardType = isDevelopment() ? 'default' : 'number-pad';

  return (
    <View className="px-4 bg-white">
      <View className="flex-row justify-between items-center gap-2">
        <View className="flex flex-row gap-2 justify-between flex-1 items-center">
          <View className="flex flex-row items-center gap-1">
            <ButtonBack
              title={<Text className="font-semibold text-base">{code}</Text>}
            />
            <CopyButton value={code as string} />
          </View>
          {status && (
            <Badge
              label={statusName}
              variant={toLower(status as string) as any}
              extraLabel={
                <Text className="text-xs text-contentPrimary ml-3">
                  | {getRelativeTime(lastTimeUpdateStatus)}
                </Text>
              }
            />
          )}
        </View>
        <Pressable
          onPress={onClickHeaderAction}
          hitSlop={20}
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <More2Fill width={20} height={20} />
        </Pressable>
      </View>
      <LabelTags tags={tags} />
      <Picker picker={picker as Employee} />
      <View className="flex flex-row mt-2 justify-between items-center pb-3 gap-3">
        <Input
          className="flex-grow"
          placeholder="Nhập barcode để pick"
          keyboardType={barcodeKeyboardType}
          prefix={
            <MaterialCommunityIcons name="barcode" size={24} color="gray" />
          }
          onChangeText={(value: string) => {
            setValue(value);
            handleSearch(value);
          }}
          editable={disabled}
          value={value}
          onClear={() => {
            setValue('');
            setKeyword('');
          }}
          allowClear
        />
        {shouldDisplayQrScan && (
          <WaveButton
            onPress={() => {
              toggleScanQrCodeProduct(true);
              setSuccessForBarcodeScan('');
              setIsEditManual(false);
            }}
            waveColor="rgba(255, 255, 255, 0.3)"
            waveSize={120}
          >
            <View className="bg-colorPrimary rounded-md size-10 flex flex-row justify-center items-center">
              <FontAwesome name="qrcode" size={24} color="white" />
            </View>
          </WaveButton>
        )}
      </View>
    </View>
  );
};

export default OrderPickHeader;
