import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StoreEmployeeItem } from '~/src/api/app-pick/use-search-store-employees';
import { Badge } from '../Badge';

type Props = {
  employee: StoreEmployeeItem;
  roleLabel: string;
  onRemove: (employee: StoreEmployeeItem) => void;
};

const EmployeeItem = ({ employee, roleLabel, onRemove }: Props) => {
  const isActive = (employee.status || '').toUpperCase() === 'ACTIVE';
  const name = employee.name || employee.username || '';

  return (
    <View
      className="mx-4 mb-3 rounded-lg bg-white px-4 py-3.5"
      style={styles.card}
    >
      {/* Hàng 1: tên đầy đủ (tối đa 2 dòng) + nút xoá */}
      <View className="flex-row items-start justify-between gap-2">
        <Text
          className="flex-1 text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {name}
        </Text>
        <Pressable
          onPress={() => onRemove(employee)}
          hitSlop={10}
          className="pt-0.5"
        >
          <Feather name="trash-2" size={15} color="#888888" />
        </Pressable>
      </View>

      {/* Hàng 2: mã nhân viên • vai trò + trạng thái */}
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <Text className="flex-1 text-sm text-gray-500" numberOfLines={1}>
          <Text className="font-medium text-gray-600">{employee.username}</Text>
          {roleLabel ? `  •  ${roleLabel}` : ''}
        </Text>
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
