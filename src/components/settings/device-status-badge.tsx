import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { cn } from '~/src/lib/utils';
import { colors } from '~/src/ui/colors';

export type DeviceConnectionStatus =
  'checking' | 'online' | 'offline' | 'unknown';

const STATUS_STYLES: Record<
  Exclude<DeviceConnectionStatus, 'checking'>,
  { container: string; dot: string; text: string; label: string }
> = {
  online: {
    container: 'bg-green-50',
    dot: 'bg-green-500',
    text: 'text-green-600',
    label: 'Đã kết nối',
  },
  offline: {
    container: 'bg-red-50',
    dot: 'bg-red-500',
    text: 'text-red-600',
    label: 'Mất kết nối',
  },
  unknown: {
    container: 'bg-gray-50 border border-gray-200',
    dot: 'bg-gray-400',
    text: 'text-gray-500',
    label: 'Chưa có IP',
  },
};

// Pill trạng thái kết nối của thiết bị: spinner khi đang kiểm tra,
// chấm màu + nhãn khi đã có kết quả.
const DeviceStatusBadge = ({ status }: { status: DeviceConnectionStatus }) => {
  if (status === 'checking') {
    return (
      <View className="flex-row items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-1">
        <ActivityIndicator size="small" color={colors.gray[500]} />
        <Text className="text-xs font-medium text-gray-500">Đang kiểm tra</Text>
      </View>
    );
  }

  const style = STATUS_STYLES[status];

  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 rounded-full px-2.5 py-1',
        style.container,
      )}
    >
      <View className={cn('w-2 h-2 rounded-full', style.dot)} />
      <Text className={cn('text-xs font-semibold', style.text)}>
        {style.label}
      </Text>
    </View>
  );
};

export default DeviceStatusBadge;
