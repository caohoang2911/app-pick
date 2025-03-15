import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { toLower } from 'lodash';
import moment from 'moment';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSearchOrders } from '~/src/api/app-pick/use-search-orders';
import { queryClient } from '~/src/api/shared/api-provider';
import { useAuth } from '~/src/core/store/auth';
import { setKeyWord, useOrders } from '~/src/core/store/orders';
import { formatCurrency } from '~/src/core/utils/number';
import { Badge } from '../Badge';
import SearchableDropdown from '../SearchableDropdown';

const OrderItem = memo(({ item }: { item: any }) => {
  const handleSelect = useCallback(() => {
    if(item.type === 'STORE_DELIVERY') {
      router.push(`orders/order-invoice/${item.code}`);
    } else {
      router.push({ pathname: `orders/order-detail/${item.code}`, params: { status: item.status } });
    }
  }, [item.code, item.status, item.type]);

  const formattedAmount = useMemo(() => 
    formatCurrency(item.amount, {unit: true}), 
    [item.amount]
  );
  
  const timeFromNow = useMemo(() => 
    moment(item.lastTimeUpdateStatus).fromNow(),
    [item.lastTimeUpdateStatus]
  );

  return (
    <TouchableOpacity 
      className="py-3 px-2"
      style={{borderTopWidth: 1, borderColor: '#E0E0E0'}}
      onPress={handleSelect}>
      <View className="flex flex-row items-center justify-between">
        <Text className="font-semibold">{item.code}</Text>
        <Badge
          label={item.statusName}
          variant={toLower(item.status) as any}
          extraLabel={<Text className="text-xs text-contentPrimary ml-3">
            | {timeFromNow}
          </Text>}
        />
      </View>
      <View className="flex flex-row gap-2 items-center justify-between mt-2">
        <View className="flex flex-row gap-2 items-center flex-1">
          <View className="-mt-0.5">
            <Feather name="user" size={18} color="black" />
          </View>
          <Text className="text-sm font-semibold" style={{width: '85%'}} numberOfLines={1} ellipsizeMode="tail">
            {item.customer?.name}
          </Text>
        </View>
        <Badge 
          label={<Text className="text-base mr-2">{formattedAmount}</Text>}  
          extraLabel={<Text className="text-sm text-contentPrimary ml-3">
            - {item.payment?.methodName}
          </Text>}
          variant="warning" 
        />
      </View>
    </TouchableOpacity>
  );
});

const InputSearch = ({
  toggleScanQrCode,
}: {
  toggleScanQrCode: (value: boolean) => void;
}) => {
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [value, setValue] = useState<string>();
  const { storeCode } = useAuth.use.userInfo();
  const keyword = useOrders.use.keyword();

  useEffect(() => {
    if (keyword && !value) {
      setValue(keyword);
    }
  }, []);

  const params = useMemo(() => ({
    keyword: value || '',
    storeCode,
  }), [value, storeCode]);

  const {
    data: ordersResponse,
    refetch,
    isRefetching,
  } = useSearchOrders({...params}, {
    enabled: !!value,
  });

  const handleTextChange = useCallback((text: string) => {
    setValue(text);
    
    setKeyWord(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      if(value) {
        refetchOrders();
      }
    }, 300);
  }, []);

  const refetchOrders = useCallback(async () => {
    try {
      await queryClient.resetQueries({ queryKey: ['searchOrders', params] });
      refetch();
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  }, [params, refetch]);

  const orderList = useMemo(() => {
    if(!value) return [];
    const pages = ordersResponse?.pages || [];
    return pages.flat();
  }, [ordersResponse?.pages]);

  const renderItem = useCallback((item: any) => {
    return <OrderItem item={item} />;
  }, []);
  
  const handleSelect = useCallback((item: any) => {
    if(item.type === 'STORE_DELIVERY') {
      router.push(`orders/order-invoice/${item.code}`);
    } else {
      router.push({ pathname: `orders/order-detail/${item.code}`, params: { status: item.status } });
    }
  }, []);

  const rightComponent = useMemo(() => (
    <TouchableOpacity onPress={() => toggleScanQrCode(true)}>
      <View className="bg-colorPrimary rounded-md size-10 flex flex-row justify-center items-center">
        <FontAwesome name="qrcode" size={24} color="white" />
      </View>
    </TouchableOpacity>
  ), [toggleScanQrCode]);
  
  return (
    <View className="flex-grow">
      <SearchableDropdown
        isLoading={isRefetching}
        items={orderList}
        renderItem={renderItem}
        onSelect={handleSelect}
        onChangeText={handleTextChange}
        maxDropdownHeight={400}
        placeholder="Mã đơn hàng, SDT khách hàng"
        right={rightComponent}
        // allowSearch={true}
      />
    </View>
  );
};

export default memo(InputSearch);