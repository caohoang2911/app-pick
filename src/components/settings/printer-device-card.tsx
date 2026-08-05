import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { cn } from '~/src/lib/utils';
import { colors } from '~/src/ui/colors';
import { Button } from '../Button';
import { Input } from '../Input';
import DeviceStatusBadge, {
  type DeviceConnectionStatus,
} from './device-status-badge';
import SettingsCard from './settings-card';

type Props = {
  title: string;
  tint: 'blue' | 'orange';
  ip: string;
  placeholder?: string;
  status: DeviceConnectionStatus;
  /** Đang test/lưu — khóa các action của card */
  busy?: boolean;
  saving?: boolean;
  onChangeIp: (ip: string) => void;
  onTest: () => void;
  onSave: () => void;
  /** Reset về IP mặc định của siêu thị (behavior cũ: set + lưu ngay) */
  onReset?: () => void;
  onFocusInput?: () => void;
  /** Ref vùng input để scroll vào view khi bàn phím mở */
  inputWrapperRef?: React.Ref<View>;
};

const TINT_STYLES = {
  blue: { container: 'bg-blue-50', icon: colors.blue[600] },
  orange: { container: 'bg-orange-100', icon: colors.orange[500] },
} as const;

// Card thiết bị máy in: icon + tên + trạng thái kết nối, hàng nhập IP
// (label cùng dòng với input), nút test kết nối và lưu IP.
const PrinterDeviceCard = ({
  title,
  tint,
  ip,
  placeholder,
  status,
  busy = false,
  saving = false,
  onChangeIp,
  onTest,
  onSave,
  onReset,
  onFocusInput,
  inputWrapperRef,
}: Props) => {
  const tintStyle = TINT_STYLES[tint];
  const actionsDisabled = busy || !ip;

  return (
    <SettingsCard>
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            'h-12 w-12 items-center justify-center rounded-xl',
            tintStyle.container,
          )}
        >
          <Ionicons name="print-outline" size={26} color={tintStyle.icon} />
        </View>
        <Text className="flex-1 text-base font-bold text-gray-900">
          {title}
        </Text>
        <DeviceStatusBadge status={status} />
      </View>

      {/* Label bên trái, cột input + hàng nút bên phải (thẳng lề với input) */}
      <View
        ref={inputWrapperRef}
        collapsable={false}
        className="mt-3 flex-row gap-3"
      >
        <View className="h-11 justify-center">
          <Text className="text-sm text-gray-600">Địa chỉ IP</Text>
        </View>
        <View className="flex-1">
          <Input
            value={ip}
            placeholder={placeholder}
            onChangeText={onChangeIp}
            onFocus={onFocusInput}
            autoCapitalize="none"
            autoCorrect={false}
            suffix={
              onReset ? (
                <TouchableOpacity
                  onPress={onReset}
                  disabled={busy}
                  hitSlop={8}
                  accessibilityLabel="Đặt lại về IP mặc định"
                >
                  <Text className="text-sm font-medium text-blue-600">
                    Đặt lại
                  </Text>
                </TouchableOpacity>
              ) : undefined
            }
          />
          <View className="mt-3 flex-row gap-2">
            <Button
              variant="secondary"
              className="flex-1 rounded-lg"
              labelClasses="text-sm font-semibold"
              icon={
                <Ionicons
                  name="pulse"
                  size={16}
                  color={colors.contentPrimary}
                />
              }
              label="Kiểm tra kết nối"
              disabled={actionsDisabled}
              onPress={onTest}
            />
            <Button
              className="flex-1 rounded-lg"
              labelClasses="text-sm font-semibold"
              icon={<Ionicons name="save-outline" size={16} color="white" />}
              label="Lưu"
              loading={saving}
              disabled={actionsDisabled}
              onPress={onSave}
            />
          </View>
        </View>
      </View>
    </SettingsCard>
  );
};

export default PrinterDeviceCard;
