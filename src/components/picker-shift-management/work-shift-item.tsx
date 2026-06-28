import Feather from '@expo/vector-icons/Feather';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  formatWorkShiftTimeRange,
  getWorkShiftPresetColor,
} from '~/src/core/utils/work-shift';
import type { WorkShift } from '~/src/types/work-shift';

type Props = {
  shift: WorkShift;
  index: number;
  onOpenActions: (shift: WorkShift) => void;
};

const WorkShiftItem = ({ shift, index, onOpenActions }: Props) => {
  const barColor = getWorkShiftPresetColor(
    shift.startTime,
    shift.endTime,
    index,
  );
  const timeLabel = formatWorkShiftTimeRange(shift.startTime, shift.endTime);

  return (
    <View className="mx-4 mb-3 rounded-lg border border-gray-200 bg-white overflow-hidden flex-row items-stretch">
      <View style={{ width: 4, backgroundColor: barColor }} />
      <View className="flex-1 px-3 py-3 flex-row items-center justify-between gap-3">
        <View className="flex-1 min-w-0 gap-1">
          <Text
            className="text-base font-semibold text-gray-900"
            numberOfLines={1}
          >
            {shift.employee.username} - {shift.employee.name}
          </Text>
          <Text className="text-sm text-gray-600">{timeLabel}</Text>
        </View>
        <Pressable onPress={() => onOpenActions(shift)} hitSlop={10}>
          <Feather name="more-vertical" size={16} color="#A0AEC0" />
        </Pressable>
      </View>
    </View>
  );
};

export default memo(WorkShiftItem);
