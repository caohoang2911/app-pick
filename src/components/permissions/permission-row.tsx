import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { Switch } from '@/components/Switch';
import type {
  AppPermissionDescriptor,
  PermissionStatus,
} from '@/types/permissions';

type StatusMeta = {
  label: string;
  textClass: string;
  bgClass: string;
};

/** Nhãn + màu cho từng trạng thái quyền. */
export const getStatusMeta = (status: PermissionStatus): StatusMeta => {
  switch (status) {
    case 'granted':
      return {
        label: 'Đã cấp',
        textClass: 'text-green-700',
        bgClass: 'bg-green-100',
      };
    case 'blocked':
      return {
        label: 'Bị chặn',
        textClass: 'text-red-700',
        bgClass: 'bg-red-100',
      };
    case 'limited':
      return {
        label: 'Giới hạn',
        textClass: 'text-amber-700',
        bgClass: 'bg-amber-100',
      };
    case 'unavailable':
      return {
        label: 'Không áp dụng',
        textClass: 'text-gray-500',
        bgClass: 'bg-gray-100',
      };
    case 'denied':
    case 'undetermined':
    default:
      return {
        label: 'Chưa cấp',
        textClass: 'text-gray-600',
        bgClass: 'bg-gray-100',
      };
  }
};

interface Props {
  descriptor: AppPermissionDescriptor;
  status: PermissionStatus;
  onToggle: (
    descriptor: AppPermissionDescriptor,
    status: PermissionStatus,
  ) => void;
  disabled?: boolean;
}

const PermissionRow = ({ descriptor, status, onToggle, disabled }: Props) => {
  const granted = status === 'granted';
  const meta = getStatusMeta(status);
  const iconTint = granted ? '#16a34a' : '#3b82f6';

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center ${
          granted ? 'bg-green-50' : 'bg-blue-50'
        }`}
      >
        <Ionicons name={descriptor.icon as any} size={20} color={iconTint} />
      </View>

      <View className="flex-1 min-w-0">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-gray-900">
            {descriptor.title}
          </Text>
          <View className={`px-2 py-0.5 rounded-full ${meta.bgClass}`}>
            <Text className={`text-[11px] font-semibold ${meta.textClass}`}>
              {meta.label}
            </Text>
          </View>
        </View>
        <Text className="text-xs text-gray-500 mt-0.5 leading-4">
          {descriptor.description}
        </Text>
      </View>

      <Switch
        value={granted}
        disabled={disabled}
        onValueChange={() => onToggle(descriptor, status)}
      />
    </View>
  );
};

export default React.memo(PermissionRow);
