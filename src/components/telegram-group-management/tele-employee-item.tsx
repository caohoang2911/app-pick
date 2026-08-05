import Feather from '@expo/vector-icons/Feather';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { TeleMentionedEmployee } from '~/src/api/app-pick/use-get-my-store-detail';
import { Badge } from '../Badge';

type Props = {
  employee: TeleMentionedEmployee;
  roleLabel?: string;
  onOpenActions: (employee: TeleMentionedEmployee) => void;
};

// Card nhân viên trong danh sách nhận mention nhóm Tele — cùng layout
// compact với EmployeeItem bên màn Quản lý nhân viên.
const TeleEmployeeItem = ({ employee, roleLabel, onOpenActions }: Props) => {
  const name = employee.name || employee.username || '';
  const status = (employee.status || '').toUpperCase();
  const hasTeleId = employee.teleId != null && String(employee.teleId) !== '';

  return (
    <View
      className="mx-4 mb-3 rounded-lg bg-white px-4 py-3.5"
      style={styles.card}
    >
      {/* Hàng 1: tên + mã nhân viên + menu ⋮ */}
      <View className="flex-row items-start justify-between gap-2">
        <Text
          className="flex-1 text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {name}
        </Text>
        <View className="flex-row items-center gap-2 pt-0.5">
          <Text className="text-sm font-medium text-gray-600">
            {employee.username}
          </Text>
          <Pressable onPress={() => onOpenActions(employee)} hitSlop={10}>
            <Feather name="more-vertical" size={16} color="#A0AEC0" />
          </Pressable>
        </View>
      </View>

      {/* Hàng 2: badge vai trò + cảnh báo thiếu Tele ID + trạng thái */}
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
          {!!roleLabel && <Badge label={roleLabel} variant="default" />}
          {!hasTeleId && <Badge label="Chưa có Tele ID" variant="warning" />}
        </View>
        {!!status && (
          <Badge
            label={status === 'ACTIVE' ? 'Đang hoạt động' : 'Ngưng hoạt động'}
            variant={status === 'ACTIVE' ? 'success' : 'danger'}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
});

export default React.memo(TeleEmployeeItem);
