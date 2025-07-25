import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '~/src/ui/colors';

interface EmptyStateProps {
  searchQuery: string;
}

const EmptyState = memo(({ searchQuery }: EmptyStateProps) => {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Feather name="users" size={48} color={colors.gray[300]} />
      <Text className="text-gray-500 text-center mt-4">
        {searchQuery ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên nào'}
      </Text>
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState; 