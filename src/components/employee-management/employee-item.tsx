import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StoreEmployeeItem } from '~/src/api/app-pick/use-search-store-employees';
import { colors } from '~/src/ui/colors';
import { Badge } from '../Badge';

type Props = {
  employee: StoreEmployeeItem;
  roleLabel: string;
  onOpenActions: (employee: StoreEmployeeItem) => void;
};

const EmployeeItem = ({ employee, roleLabel, onOpenActions }: Props) => {
  const isActive = (employee.status || '').toUpperCase() === 'ACTIVE';
  const name = employee.name || employee.username || '';
  // Nhân viên đã có Telegram ID → hiện icon tele cạnh tên.
  const hasTeleId = employee.teleId != null && String(employee.teleId) !== '';
  // Nhân viên nằm trong danh sách mention của nhóm Tele siêu thị.
  const isMentioned = !!employee.isMentionInStoreTelegramGroup;

  return (
    <View
      className="mx-4 mb-3 rounded-lg bg-white px-4 py-3.5"
      style={styles.card}
    >
      {/* Hàng 1: tên (+ icon tele nếu có teleId) + mã nhân viên + menu ⋮ */}
      <View className="flex-row items-start justify-between gap-2">
        <Text
          className="flex-1 text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {name}
        </Text>
        <View className="flex-row items-center gap-2 pt-0.5">
          {hasTeleId && (
            <Ionicons name="paper-plane" size={14} color={colors.blue[600]} />
          )}
          <Text className="text-sm font-medium text-gray-600">
            {employee.username}
          </Text>
          <Pressable onPress={() => onOpenActions(employee)} hitSlop={10}>
            <Feather name="more-vertical" size={16} color="#A0AEC0" />
          </Pressable>
        </View>
      </View>

      {/* Hàng 2: badge vai trò + Nhận Đơn Tele + trạng thái */}
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <View className="flex-1 flex-row flex-wrap items-center gap-1.5">
          {!!roleLabel && <Badge label={roleLabel} variant="default" />}
          {isMentioned && <Badge label="Nhận Đơn Tele" variant="pink" />}
        </View>
        <Badge
          label={isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
          variant={isActive ? 'success' : 'danger'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default React.memo(EmployeeItem);
