import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { toUpper } from 'lodash';
import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Images } from '~/assets';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import { hasOrderDriverInfo } from '~/src/core/utils/order';
import { OrderDetail } from '~/src/types/order-pick';
import Box from '../Box';

function providerLogoSource(provider?: string) {
  if (!provider) return null;
  const p = toUpper(provider);
  if (p === 'AHAMOVE' || p.includes('AHAMOVE')) {
    return Images.ahamove_logo;
  }
  if (p === 'GRAB_EXPRESS' || p.includes('GRAB')) {
    return Images.grab_express_logo;
  }
  return null;
}

const ShipperInfo = ({ orderDetail }: { orderDetail: OrderDetail }) => {
  const { header } = orderDetail || {};
  const { shipping } = header || {};

  const config = useConfig.use.config();
  // Try to find shipping providers config, if not available, use provider directly
  const shippingServiceTypes = (config as any)?.shippingServiceTypes || [];

  const providerName = useMemo(() => {
    if (shipping?.provider) {
      const configName = getConfigNameById(
        shippingServiceTypes,
        shipping.provider,
      );
      return configName || shipping.provider;
    }
    return '';
  }, [shipping?.provider, shippingServiceTypes]);

  const driverNameWithProvider = useMemo(() => {
    if (!shipping?.driverName) return '';
    return providerName
      ? `${shipping.driverName} - ${providerName}`
      : shipping.driverName;
  }, [shipping?.driverName, providerName]);

  const logoSource = useMemo(
    () => providerLogoSource(shipping?.provider),
    [shipping?.provider],
  );

  const isFindingDriver = !hasOrderDriverInfo(shipping);

  if (isFindingDriver) {
    return (
      <Box className="">
        <View className="flex-1 flex-row items-center gap-3 min-w-0">
          <View className="size-10 rounded-full bg-orange-100 items-center justify-center shrink-0">
            <MaterialCommunityIcons
              name="bike-fast"
              size={22}
              color="#C05621"
            />
          </View>
          <View className="flex-1 min-w-0 gap-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm font-bold text-orange-700 shrink">
                Đang tìm tài xế
              </Text>
            </View>
            <Text className="text-xs font-medium text-orange-600">
              Chưa tạo được hoá đơn
            </Text>
          </View>
          {logoSource != null && (
            <View className="shrink-0 rounded-lg bg-white px-2 py-1">
              <Image
                source={logoSource}
                resizeMode="contain"
                style={{ width: 48, height: 40 }}
                accessibilityLabel={providerName || shipping?.provider}
              />
            </View>
          )}
        </View>
      </Box>
    );
  }

  return (
    <Box className="flex flex-row items-center justify-between">
      <View className="flex-1 flex-row items-center gap-3 min-w-0">
        <MaterialCommunityIcons
          name="bike-fast"
          size={25}
          color="#999999"
          style={{ flexShrink: 0 }}
        />
        <View className="flex-1 min-w-0 gap-1 items-start">
          {!!driverNameWithProvider && (
            <Text className="text-sm font-medium" numberOfLines={1}>
              {driverNameWithProvider}
            </Text>
          )}
          {!!shipping?.driverPhone && (
            <Text
              className="text-sm text-gray-500 text-left w-full"
              numberOfLines={1}
            >
              {shipping.driverPhone}
            </Text>
          )}
        </View>
        {logoSource != null && (
          <View className="shrink-0">
            <Image
              source={logoSource}
              resizeMode="contain"
              style={{ width: 55, height: 58 }}
              accessibilityLabel={providerName || shipping?.provider}
            />
          </View>
        )}
      </View>
    </Box>
  );
};

export default ShipperInfo;
