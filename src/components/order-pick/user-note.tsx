import clsx from 'clsx';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { MarkdownText } from '@/core/utils/markdown';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-pick';

const COLLAPSED_LINE_LIMIT = 5;

const stickyNoteShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
});

const UserNote = ({ orderDetail }: { orderDetail: OrderDetail }) => {
  const pickerNote = orderDetail?.header?.pickerNote;
  const isSticky = useOrderPick.use.isScrolledDown();
  const [expanded, setExpanded] = useState(false);

  const lines = useMemo(
    () =>
      (pickerNote ?? '')
        .trim()
        .split(/\n+/)
        .filter((line) => line.trim()),
    [pickerNote],
  );

  const isLongNote = lines.length > COLLAPSED_LINE_LIMIT;
  const visibleLines = expanded ? lines : lines.slice(0, COLLAPSED_LINE_LIMIT);

  useEffect(() => {
    setExpanded(false);
  }, [pickerNote]);

  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (!pickerNote) return null;

  return (
    <View
      className={clsx(
        isSticky ? 'bg-white -mt-3 pt-0 pb-2 z-10' : 'bg-gray-50',
      )}
      style={isSticky ? stickyNoteShadow : undefined}
    >
      <View
        className={clsx(
          'mx-4 px-3 py-2 rounded-md bg-orange-500',
          isSticky ? 'mb-0 ' : 'mb-3 ',
        )}
      >
        {visibleLines.map((line, index) => (
          <View key={`${index}-${line}`} className="flex-row items-start">
            <View className="size-1.5 bg-white rounded-full mr-2 mt-2.5 shrink-0" />
            <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
              <MarkdownText
                className="text-base font-semibold text-white"
                linkStyle={{ color: '#ffffff' }}
              >
                {line.trim()}
              </MarkdownText>
            </View>
          </View>
        ))}
        {isLongNote ? (
          <Pressable
            onPress={handleToggleExpand}
            hitSlop={8}
            className="mt-1 self-end"
          >
            <Text className="text-sm font-semibold text-white underline">
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export default memo(UserNote);
