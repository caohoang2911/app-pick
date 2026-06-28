import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import moment from 'moment-timezone';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { InteractionManager, Pressable, Text, View } from 'react-native';
import { Button } from '~/src/components/Button';
import SBottomSheet from '~/src/components/SBottomSheet';
import {
  WORK_SHIFT_DAY_LABELS,
  WORK_SHIFT_TIMEZONE,
  getWorkShiftDayCount,
} from '~/src/core/utils/work-shift';

export type WorkShiftDateRange = {
  startTimestamp: number;
  endTimestamp: number;
};

export type WorkShiftDatePickerBottomSheetRef = {
  present: (range: WorkShiftDateRange) => void;
  dismiss: () => void;
};

type Props = {
  onSelect: (range: WorkShiftDateRange) => void;
};

const WEEKDAY_HEADERS = WORK_SHIFT_DAY_LABELS;
const MONTHS_BACK = 2;
const MONTHS_FORWARD = 2;
const DAY_ROW_HEIGHT = 50;
const DEFAULT_LIST_VIEWPORT_HEIGHT = 340;
/** Chừa vùng trên list để không dính header cố định (range + weekdays). */
const LIST_TOP_CLEARANCE = 56;
const LIST_BOTTOM_CLEARANCE = 24;
const LIST_CONTENT_PADDING_TOP = 8;

function buildMonthGrid(month: moment.Moment) {
  const startOfMonth = month.clone().startOf('month');
  const daysInMonth = month.daysInMonth();
  const leadingEmpty = startOfMonth.day();

  const cells: Array<moment.Moment | null> = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(startOfMonth.clone().date(day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function toDayKey(timestamp: number) {
  return moment.tz(timestamp, WORK_SHIFT_TIMEZONE).format('YYYY-MM-DD');
}

type MonthGridProps = {
  month: moment.Moment;
  todayKey: string;
  rangeStartKey: string | null;
  rangeEndKey: string | null;
  isInSelectedRange: (key: string) => boolean;
  onSelectDay: (date: moment.Moment) => void;
};

function MonthGrid({
  month,
  todayKey,
  rangeStartKey,
  rangeEndKey,
  isInSelectedRange,
  onSelectDay,
}: MonthGridProps) {
  const monthCells = useMemo(() => buildMonthGrid(month), [month]);

  return (
    <View className="mb-5">
      <Text className="mb-3 text-sm font-semibold text-gray-800">
        Tháng {month.format('MM/YYYY')}
      </Text>
      <View className="flex-row flex-wrap">
        {monthCells.map((date, index) => {
          if (!date) {
            return (
              <View
                key={`empty-${index}`}
                className="w-[14.28%] aspect-square"
              />
            );
          }

          const key = date.format('YYYY-MM-DD');
          const isToday = key === todayKey;
          const isRange = isInSelectedRange(key);
          const isRangeStart = key === rangeStartKey;
          const isRangeEnd = key === rangeEndKey;
          const isEdge = isRangeStart || isRangeEnd;

          let backgroundColor = 'transparent';
          if (isEdge) {
            backgroundColor = '#3280F6';
          } else if (isRange) {
            backgroundColor = '#DBEAFE';
          }

          return (
            <Pressable
              key={key}
              onPress={() => onSelectDay(date)}
              className="w-[14.28%] aspect-square items-center justify-center p-0.5"
            >
              <View
                style={{ backgroundColor }}
                className="w-full h-full items-center justify-center rounded-full"
              >
                <Text
                  className={`text-sm ${
                    isEdge
                      ? 'text-white font-semibold'
                      : isRange
                        ? 'text-blue-700 font-medium'
                        : isToday
                          ? 'text-blue-500 font-semibold'
                          : 'text-gray-800'
                  }`}
                >
                  {date.date()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function getScrollTargetDayKey(
  startTimestamp: number,
  endTimestamp: number,
  todayKey: string,
) {
  const startKey = toDayKey(startTimestamp);
  const endKey = toDayKey(endTimestamp);
  const rangeStart = startKey <= endKey ? startKey : endKey;
  const rangeEnd = startKey <= endKey ? endKey : startKey;

  if (todayKey >= rangeStart && todayKey <= rangeEnd) {
    return todayKey;
  }

  return rangeStart;
}

function getDayRowOffsetInMonth(month: moment.Moment, dayKey: string) {
  const cells = buildMonthGrid(month);
  const cellIndex = cells.findIndex(
    (date) => date?.format('YYYY-MM-DD') === dayKey,
  );
  if (cellIndex < 0) return 0;

  const rowIndex = Math.floor(cellIndex / 7);
  const MONTH_TITLE_HEIGHT = 44;

  return MONTH_TITLE_HEIGHT + rowIndex * DAY_ROW_HEIGHT;
}

function getMonthBlockHeight(month: moment.Moment) {
  const cells = buildMonthGrid(month);
  const rowCount = cells.length / 7;
  const MONTH_TITLE_HEIGHT = 44;
  const MONTH_GAP = 20;

  return MONTH_TITLE_HEIGHT + rowCount * DAY_ROW_HEIGHT + MONTH_GAP;
}

function getDayScrollOffset(dayKey: string, months: moment.Moment[]) {
  const monthKey = dayKey.slice(0, 7);
  const monthIndex = months.findIndex(
    (month) => month.format('YYYY-MM') === monthKey,
  );
  if (monthIndex < 0) return 0;

  let offset = 0;
  for (let i = 0; i < monthIndex; i += 1) {
    offset += getMonthBlockHeight(months[i]!);
  }

  const month = months[monthIndex];
  if (!month) return offset;

  return offset + getDayRowOffsetInMonth(month, dayKey);
}

function getScrollAnchorOffset(contentOffset: number, viewportHeight: number) {
  const usableHeight = Math.max(
    DAY_ROW_HEIGHT,
    viewportHeight -
      LIST_TOP_CLEARANCE -
      LIST_BOTTOM_CLEARANCE -
      LIST_CONTENT_PADDING_TOP,
  );
  const anchoredOffset =
    contentOffset -
    LIST_TOP_CLEARANCE -
    LIST_CONTENT_PADDING_TOP -
    usableHeight / 2 +
    DAY_ROW_HEIGHT / 2;

  return Math.max(0, anchoredOffset);
}

function getCenteredScrollOffsetForDay(
  dayKey: string,
  months: moment.Moment[],
  viewportHeight: number,
) {
  const dayOffset = getDayScrollOffset(dayKey, months);
  return getScrollAnchorOffset(dayOffset, viewportHeight);
}

const WorkShiftDatePickerBottomSheet = forwardRef<
  WorkShiftDatePickerBottomSheetRef,
  Props
>(({ onSelect }, ref) => {
  const [visible, setVisible] = useState(false);
  const [draftStart, setDraftStart] = useState<number | null>(null);
  const [draftEnd, setDraftEnd] = useState<number | null>(null);
  const [scrollTargetDayKey, setScrollTargetDayKey] = useState<string | null>(
    null,
  );
  const [listViewportHeight, setListViewportHeight] = useState(0);
  const sheetRef = useRef<any>(null);
  const listRef = useRef<any>(null);
  const hasScrolledToTarget = useRef(false);
  const scrollRetryTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const todayKey = useMemo(
    () => moment.tz(WORK_SHIFT_TIMEZONE).format('YYYY-MM-DD'),
    [visible],
  );

  const months = useMemo(() => {
    const anchor = moment
      .tz(WORK_SHIFT_TIMEZONE)
      .startOf('month')
      .subtract(MONTHS_BACK, 'month');

    return Array.from(
      { length: MONTHS_BACK + MONTHS_FORWARD + 1 },
      (_, index) => anchor.clone().add(index, 'month'),
    );
  }, [visible]);

  const monthHeights = useMemo(() => months.map(getMonthBlockHeight), [months]);

  const targetMonthIndex = useMemo(() => {
    if (!scrollTargetDayKey) return 0;
    const monthKey = scrollTargetDayKey.slice(0, 7);
    const index = months.findIndex(
      (month) => month.format('YYYY-MM') === monthKey,
    );
    return index >= 0 ? index : 0;
  }, [months, scrollTargetDayKey]);

  const targetViewOffset = useMemo(() => {
    if (!scrollTargetDayKey) return 0;
    const monthKey = scrollTargetDayKey.slice(0, 7);
    const month = months.find((item) => item.format('YYYY-MM') === monthKey);
    if (!month) return 0;

    const viewportHeight =
      listViewportHeight > 0
        ? listViewportHeight
        : DEFAULT_LIST_VIEWPORT_HEIGHT;
    const rowOffset = getDayRowOffsetInMonth(month, scrollTargetDayKey);

    return getScrollAnchorOffset(rowOffset, viewportHeight);
  }, [listViewportHeight, months, scrollTargetDayKey]);

  const draftStartKey = draftStart == null ? null : toDayKey(draftStart);
  const draftEndKey = draftEnd == null ? null : toDayKey(draftEnd);

  const rangeStartKey = useMemo(() => {
    if (!draftStartKey) return null;
    if (!draftEndKey) return draftStartKey;
    return draftStartKey <= draftEndKey ? draftStartKey : draftEndKey;
  }, [draftEndKey, draftStartKey]);

  const rangeEndKey = useMemo(() => {
    if (!draftStartKey) return null;
    if (!draftEndKey) return draftStartKey;
    return draftStartKey <= draftEndKey ? draftEndKey : draftStartKey;
  }, [draftEndKey, draftStartKey]);

  const selectedDayCount = useMemo(() => {
    if (draftStart == null) return 0;
    if (draftEnd == null) return 1;
    return getWorkShiftDayCount(draftStart, draftEnd);
  }, [draftEnd, draftStart]);

  const clearScrollRetryTimers = useCallback(() => {
    scrollRetryTimers.current.forEach(clearTimeout);
    scrollRetryTimers.current = [];
  }, []);

  const handleClose = useCallback(() => {
    clearScrollRetryTimers();
    setVisible(false);
    setDraftStart(null);
    setDraftEnd(null);
    setScrollTargetDayKey(null);
    setListViewportHeight(0);
    hasScrolledToTarget.current = false;
  }, [clearScrollRetryTimers]);

  const scrollToTargetDay = useCallback(() => {
    if (hasScrolledToTarget.current || !scrollTargetDayKey) return;

    const list = listRef.current;
    if (!list) return;

    const monthIndex = targetMonthIndex;
    const viewportHeight =
      listViewportHeight > 0
        ? listViewportHeight
        : DEFAULT_LIST_VIEWPORT_HEIGHT;
    const offset = getCenteredScrollOffsetForDay(
      scrollTargetDayKey,
      months,
      viewportHeight,
    );

    if (typeof list.scrollToOffset === 'function') {
      list.scrollToOffset({ offset, animated: false });
      hasScrolledToTarget.current = true;
      return;
    }

    if (typeof list.scrollToIndex === 'function') {
      list.scrollToIndex({
        index: monthIndex,
        viewOffset: targetViewOffset,
        animated: false,
      });
      hasScrolledToTarget.current = true;
    }
  }, [
    listViewportHeight,
    months,
    scrollTargetDayKey,
    targetMonthIndex,
    targetViewOffset,
  ]);

  const scheduleScrollToTarget = useCallback(() => {
    if (hasScrolledToTarget.current || !scrollTargetDayKey) return;

    clearScrollRetryTimers();
    const run = () => {
      if (!hasScrolledToTarget.current) {
        scrollToTargetDay();
      }
    };

    // Chờ bottom sheet unlock scroll (gorhom reset về 0 khi còn LOCKED lúc animate mở).
    [600, 1000, 1500, 2000].forEach((delay) => {
      const timer = setTimeout(run, delay);
      scrollRetryTimers.current.push(timer);
    });
  }, [clearScrollRetryTimers, scrollTargetDayKey, scrollToTargetDay]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number }) => {
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex?.({
          index: info.index,
          viewOffset: targetViewOffset,
          animated: false,
        });
      }, 120);
      scrollRetryTimers.current.push(timer);
    },
    [targetViewOffset],
  );

  useImperativeHandle(
    ref,
    () => ({
      present: ({ startTimestamp, endTimestamp }: WorkShiftDateRange) => {
        hasScrolledToTarget.current = false;
        clearScrollRetryTimers();
        const currentTodayKey = moment
          .tz(WORK_SHIFT_TIMEZONE)
          .format('YYYY-MM-DD');
        setDraftStart(startTimestamp);
        setDraftEnd(endTimestamp);
        setScrollTargetDayKey(
          getScrollTargetDayKey(startTimestamp, endTimestamp, currentTodayKey),
        );
        setVisible(true);
        requestAnimationFrame(() => {
          sheetRef.current?.present();
        });
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
        handleClose();
      },
    }),
    [clearScrollRetryTimers, handleClose],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index >= 0) {
        InteractionManager.runAfterInteractions(() => {
          scheduleScrollToTarget();
        });
      }
    },
    [scheduleScrollToTarget],
  );

  useEffect(() => {
    if (!visible || !scrollTargetDayKey) return;
    return clearScrollRetryTimers;
  }, [clearScrollRetryTimers, scrollTargetDayKey, visible]);

  const handleSelectDay = useCallback(
    (date: moment.Moment) => {
      const timestamp = date.clone().startOf('day').valueOf();

      if (draftStart == null || draftEnd != null) {
        setDraftStart(timestamp);
        setDraftEnd(null);
        return;
      }

      const startMoment = moment.tz(draftStart, WORK_SHIFT_TIMEZONE);
      if (date.isBefore(startMoment, 'day')) {
        setDraftStart(timestamp);
        setDraftEnd(null);
        return;
      }

      setDraftEnd(date.clone().endOf('day').valueOf());
    },
    [draftEnd, draftStart],
  );

  const handleConfirm = useCallback(() => {
    if (draftStart == null) return;

    const startTimestamp = draftStart;
    const endTimestamp =
      draftEnd ??
      moment.tz(draftStart, WORK_SHIFT_TIMEZONE).endOf('day').valueOf();

    const start = moment.tz(startTimestamp, WORK_SHIFT_TIMEZONE).startOf('day');
    const end = moment.tz(endTimestamp, WORK_SHIFT_TIMEZONE).startOf('day');

    onSelect({
      startTimestamp: (start.isBefore(end) ? start : end).valueOf(),
      endTimestamp: (start.isBefore(end) ? end : start)
        .clone()
        .endOf('day')
        .valueOf(),
    });
    sheetRef.current?.dismiss();
    handleClose();
  }, [draftEnd, draftStart, handleClose, onSelect]);

  const isInSelectedRange = useCallback(
    (key: string) => {
      if (!rangeStartKey || !rangeEndKey) return false;
      return key >= rangeStartKey && key <= rangeEndKey;
    },
    [rangeEndKey, rangeStartKey],
  );

  const rangeSummary = useMemo(() => {
    if (!rangeStartKey) {
      return 'Chọn ngày bắt đầu · cuộn để xem tháng khác';
    }
    if (!draftEnd) {
      return `Từ ${moment.tz(rangeStartKey, 'YYYY-MM-DD', WORK_SHIFT_TIMEZONE).format('DD/MM/YYYY')} — chọn ngày kết thúc (có thể chọn tháng tương lai)`;
    }

    const startLabel = moment
      .tz(rangeStartKey, 'YYYY-MM-DD', WORK_SHIFT_TIMEZONE)
      .format('DD/MM/YYYY');
    const endLabel = moment
      .tz(rangeEndKey!, 'YYYY-MM-DD', WORK_SHIFT_TIMEZONE)
      .format('DD/MM/YYYY');

    return `${startLabel} - ${endLabel} (${selectedDayCount} ngày)`;
  }, [draftEnd, rangeEndKey, rangeStartKey, selectedDayCount]);

  const getItemLayout = useCallback(
    (_: ArrayLike<moment.Moment> | null | undefined, index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i += 1) {
        offset += monthHeights[i] ?? 0;
      }

      return {
        length: monthHeights[index] ?? 0,
        offset,
        index,
      };
    },
    [monthHeights],
  );

  const renderMonth = useCallback(
    ({ item: month }: { item: moment.Moment }) => (
      <MonthGrid
        month={month}
        todayKey={todayKey}
        rangeStartKey={rangeStartKey}
        rangeEndKey={rangeEndKey}
        isInSelectedRange={isInSelectedRange}
        onSelectDay={handleSelectDay}
      />
    ),
    [handleSelectDay, isInSelectedRange, rangeEndKey, rangeStartKey, todayKey],
  );

  const handleListLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const height = event.nativeEvent.layout.height;
      if (height <= 0) return;

      setListViewportHeight((prev) => (prev === height ? prev : height));
    },
    [],
  );

  const keyExtractor = useCallback(
    (month: moment.Moment) => month.format('YYYY-MM'),
    [],
  );

  return (
    <SBottomSheet
      ref={sheetRef}
      visible={visible}
      title="Chọn khoảng thời gian"
      titleAlign="center"
      snapPoints={['78%']}
      onClose={handleClose}
      onChange={handleSheetChange}
      disableScrollView
      extraButton={
        <View className="px-4 pb-6 pt-2 bg-white border-t border-gray-100">
          <Button
            label="Áp dụng"
            onPress={handleConfirm}
            disabled={draftStart == null}
          />
        </View>
      }
    >
      <View className="px-4 pt-2 pb-3 bg-white border-b border-gray-100">
        <Text className="mb-3 text-center text-sm text-gray-500">
          {rangeSummary}
        </Text>

        <View className="flex-row">
          {WEEKDAY_HEADERS.map((label) => (
            <View key={label} className="flex-1 items-center">
              <Text className="text-xs font-medium text-gray-400">{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <BottomSheetFlatList
        key={scrollTargetDayKey ?? 'calendar'}
        ref={listRef}
        data={months}
        keyExtractor={keyExtractor}
        renderItem={renderMonth}
        getItemLayout={getItemLayout}
        initialScrollIndex={targetMonthIndex}
        onLayout={handleListLayout}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 8,
        }}
      />
    </SBottomSheet>
  );
});

export default WorkShiftDatePickerBottomSheet;
