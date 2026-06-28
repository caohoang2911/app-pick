import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { WorkShiftDay } from '~/src/core/utils/work-shift';

const HORIZONTAL_PADDING = 16;

type Props = {
  days: WorkShiftDay[];
  selectedDayKey: string;
  shiftCountByDay: Map<string, number>;
  onSelectDay: (dayKey: string) => void;
};

export default function WorkShiftWeekCalendar({
  days,
  selectedDayKey,
  shiftCountByDay,
  onSelectDay,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const itemLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const [viewportWidth, setViewportWidth] = useState(0);

  const scrollDayIntoView = useCallback(
    (dayKey: string, animated = true) => {
      const layout = itemLayouts.current[dayKey];
      if (!layout || viewportWidth <= 0) return;

      const itemCenter = HORIZONTAL_PADDING + layout.x + layout.width / 2;
      const targetX = itemCenter - viewportWidth / 2;

      scrollRef.current?.scrollTo({
        x: Math.max(0, targetX),
        animated,
      });
    },
    [viewportWidth],
  );

  useEffect(() => {
    itemLayouts.current = {};
  }, [days]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollDayIntoView(selectedDayKey, true);
    });
  }, [days, scrollDayIntoView, selectedDayKey]);

  const handleSelectDay = useCallback(
    (dayKey: string) => {
      onSelectDay(dayKey);
      requestAnimationFrame(() => scrollDayIntoView(dayKey));
    },
    [onSelectDay, scrollDayIntoView],
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(event) => {
        setViewportWidth(event.nativeEvent.layout.width);
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
      }}
    >
      {days.map((day) => {
        const isSelected = day.key === selectedDayKey;
        const isToday = day.isToday;
        const shiftCount = shiftCountByDay.get(day.key) ?? 0;

        return (
          <Pressable
            key={day.key}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              itemLayouts.current[day.key] = { x, width };
              if (day.key === selectedDayKey) {
                requestAnimationFrame(() => scrollDayIntoView(day.key, false));
              }
            }}
            onPress={() => handleSelectDay(day.key)}
            style={{ alignItems: 'center', minWidth: 40 }}
          >
            <Text
              style={{
                fontSize: 12,
                marginBottom: 4,
                color: day.isPast ? '#CBD5E0' : isToday ? '#5B8DEF' : '#718096',
              }}
            >
              {day.dayLabel}
            </Text>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? '#3280F6' : 'transparent',
                borderWidth: isToday && !isSelected ? 1 : 0,
                borderColor: '#93C5FD',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isToday && !isSelected ? '500' : '600',
                  color: isSelected
                    ? '#FFFFFF'
                    : day.isPast
                      ? '#CBD5E0'
                      : '#1A202C',
                }}
              >
                {day.dateNumber}
              </Text>
            </View>
            <View
              style={{
                minHeight: 14,
                marginTop: 4,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {shiftCount > 0 ? (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: '#3280F6',
                  }}
                >
                  {shiftCount}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
