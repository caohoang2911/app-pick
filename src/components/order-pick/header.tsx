import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useGlobalSearchParams } from 'expo-router';
import { toLower } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { GROUP_SHIPPING_ENABLED } from '~/src/contants/flag';
import { ORDER_STATUS_BADGE_VARIANT } from '~/src/contants/order';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { useConfig } from '~/src/core/store/config';
import { setIsEditManual, setKeyword, setSuccessForBarcodeScan, toggleScanQrCodeProduct, useOrderPick } from '~/src/core/store/order-pick';
import { getConfigNameById } from "~/src/core/utils/config";
import { getRelativeTime } from '~/src/core/utils/moment';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Employee } from '~/src/types/employee';
import { OrderDetail } from '~/src/types/order-pick';
import { Product, ProductItemGroup } from '~/src/types/product';
import { Badge } from '../Badge';
import { Input } from '../Input';
import WaveButton from '../shared/WaveButton';
import { GroupShippingInfo } from './group-shipping-info';

const TimeNow = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <View className='flex justify-end flex-row gap-2 absolute right-4' style={{ opacity: 0.1, top: 38 }}>
      <Text className='text-xs'>
        {formatTime(currentTime)}
      </Text>
    </View>
  )
}

const HeaderTags = ({tags}: {tags?: string[]}) => {
  const configs = useConfig.use.config();
  const orderTags = configs?.orderTags || [];

  return (
    <View className="flex flex-row gap-1 flex-wrap">
      {tags?.map((tag) => {
        const tagName = getConfigNameById(orderTags, tag);
        return  (
          <Badge
            className="self-start rounded-md"
            key={tag} label={tagName as string}
            style={{marginHorizontal: 0}}
            variant={ORDER_STATUS_BADGE_VARIANT[tag as keyof typeof ORDER_STATUS_BADGE_VARIANT] as any} />
        )
      })}
    </View>
  )
}

const Picker = ({picker}: {picker: {username: string, name: string}}) => {
  if (!picker) return null;
  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);

  const totalPickedDone = useMemo(() => {
    return orderPickProductsFlat?.filter((bag: Product | ProductItemGroup) => (bag as Product).pickedTime)?.length;
  }, [orderPickProductsFlat]);

  return (
    <View className='flex flex-row items-center justify-between mt-2'>
      <View className='flex flex-row items-center'>
        <Feather name="package" size={18} color="gray" />
        <View className="flex flex-row gap-1 items-center ml-2 max-w-[80%]">
          <Text className="text-sm text-gray-500">Picker</Text>
          <Text className="text-sm" numberOfLines={1} ellipsizeMode='tail'>{picker?.name} - {picker?.username}</Text>
        </View>
      </View>
      <View className='flex flex-row gap-1 items-center'>
        <Text className='text-sm text-gray-500'>Pick</Text>
        <Badge label={`${totalPickedDone || 0}/${orderPickProductsFlat?.length || 0}`} variant="warning" />
      </View>
    </View>
  )
}
type Props = {
  onClickHeaderAction?: () => void;
};

const OrderPickHeader = ({ onClickHeaderAction }: Props) => {
  const keyword = useOrderPick.use.keyword();
  const { code } = useGlobalSearchParams<{ code: string }>();
  const [value, setValue] = useState<string>();
  const disabled = useCanEditOrderPick();

  useEffect(() => {
    setValue(keyword);
  }, [keyword]);

  useEffect(() => {
    setKeyword('');

    return () => {
      setKeyword('');
    }
  }, [code])

  const handleSearch = useCallback(
    (value: string) => {
      setKeyword(value);
    },
    []
  );

  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { status, statusName,  lastTimeUpdateStatus, tags, picker } = header || {};

  const shouldDisplayQrScan = useCanEditOrderPick();

  return (
    <View className="px-4 bg-white">
      <View className="flex-row justify-between gap-2">
        <View className="flex flex-row gap-2 justify-between flex-1 items-center">
          <View className='flex flex-row items-center gap-1'>
            <ButtonBack title={<Text className="font-semibold text-base">{code}</Text>} />
          </View>
          {status && (
            <Badge
              label={statusName}
              variant={toLower(status as string) as any}
              extraLabel={<Text className="text-xs text-contentPrimary ml-3">
                | {getRelativeTime(lastTimeUpdateStatus)}
              </Text>}
            />
          )}
        </View>
        <WaveButton onPress={onClickHeaderAction} waveColor="rgba(0, 0, 0, 0.1)" waveSize={80}>
          <View className='w-10 h-10 justify-center  items-center'>
            <More2Fill width={20} height={20} />
          </View>
        </WaveButton>
      </View>
      <TimeNow />
      <HeaderTags tags={tags} />
      <Picker picker={picker as Employee} />
      {GROUP_SHIPPING_ENABLED && <GroupShippingInfo />}
      <View className="flex flex-row mt-2 justify-between items-center pb-3 gap-3">
        <Input
          className="flex-grow"
          placeholder="Nhập barcode để pick"
          prefix={
            <MaterialCommunityIcons name="barcode" size={24} color="gray" />
          }
          onChangeText={(value: string) => {
            setValue(value);
            handleSearch(value)
          }}
          editable={disabled}
          value={value}
          onClear={() => {
            setValue("");
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
