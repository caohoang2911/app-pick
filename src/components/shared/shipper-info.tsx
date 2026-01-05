import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import { OrderDetail } from '~/src/types/order-pick';
import Box from '../Box';

const ShipperInfo = ({ orderDetail }: { orderDetail: OrderDetail }) => {
  const { header } = orderDetail || {};
  const { shipping } = header || {};

  const config = useConfig.use.config();
  // Try to find shipping providers config, if not available, use provider directly
  const shippingProviders = (config as any)?.shippingProviders || [];

  const providerName = useMemo(() => {
    if (shipping?.provider) {
      const configName = getConfigNameById(
        shippingProviders,
        shipping.provider,
      );
      return configName || shipping.provider;
    }
    return '';
  }, [shipping?.provider, shippingProviders]);

  const driverNameWithProvider = useMemo(() => {
    if (!shipping?.driverName) return '';
    return providerName
      ? `${shipping.driverName} - ${providerName}`
      : shipping.driverName;
  }, [shipping?.driverName, providerName]);

  // Only show if shipper info exists
  if (!shipping?.driverName && !shipping?.driverPhone) {
    return null;
  }

  return (
    <Box className="flex flex-row items-center gap-5">
      <MaterialCommunityIcons name="bike-fast" size={25} color="#999999" />
      <View className="flex gap-2">
        {driverNameWithProvider && (
          <Text className="text-sm font-medium">
            {driverNameWithProvider || '--'}
          </Text>
        )}
        {shipping?.driverPhone && (
          <Text className="text-sm text-gray-500">
            {shipping.driverPhone || '--'}
          </Text>
        )}
      </View>
    </Box>
  );
};

export default ShipperInfo;
