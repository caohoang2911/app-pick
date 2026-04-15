import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { Images } from '~/assets';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import { OrderDetail } from '~/src/types/order-pick';
import Box from '../Box';

function providerLogoSource(provider?: string) {
  if (!provider) return null;
  const p = provider.toUpperCase();
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

  // // Only show if shipper info exists
  // if (!shipping?.driverName && !shipping?.driverPhone) {
  //   return null;
  // }

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
