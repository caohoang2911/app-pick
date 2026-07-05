import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import moment from 'moment-timezone';
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';
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

// ─── Cửa sổ today ± 2 + định vị SAU khi mở ──────────────────────────────────
// Lịch = 2 tháng TRƯỚC today + today + 2 tháng SAU. Vì có tháng phía trước,
// tháng cần xem KHÔNG ở index 0 → phải cuộn tới.
// gorhom KHOÁ scroll cho tới khi sheet settle; cuộn trong lúc khoá bị worklet
// kéo về 0 (bản cũ dùng loạt timer nên giật). QUAN TRỌNG: contentOffset /
// initialScrollIndex làm ĐƠ LUÔN scroll trong BottomSheetFlatList (initialScroll
// Index>0 set pendingScrollUpdateCount, chờ 1 scroll event "hợp lệ" mà lock nuốt
// mất) → TUYỆT ĐỐI không dùng.
// Cách chạy: mount list (ẩn opacity 0) → tới onChange(settle)=UNLOCK thì cuộn
// ĐÚNG 1 lần (scrollToOffset, tức thời) tới tháng mục tiêu rồi mới hiện lịch →
// cuộn mượt bình thường, mở lên không thấy cú nhảy.
const MONTHS_BACK = 2;
const MONTHS_FORWARD = 2;

// Chiều cao ước lượng cho getItemLayout + offset cuộn-định-vị. Ô ngày là
// aspect-square (~51–57px tuỳ máy) nên đây là ƯỚC LƯỢNG; lệch vài px không sao,
// FlatList tự chỉnh chính xác khi cuộn.
const DAY_ROW_HEIGHT = 50;
const MONTH_TITLE_HEIGHT = 44;
const MONTH_GAP = 20;

// Ref ổn định cho contentContainerStyle: theo guideline của repo, style object
// inline mới mỗi lần render dễ đẩy gorhom/portal vào vòng lặp render.
const CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: 16,
  paddingBottom: 16,
  paddingTop: 8,
};

type DayCell = {
  key: string; // 'YYYY-MM-DD'
  dateNumber: number;
  date: moment.Moment; // moment 00:00 giờ VN, truyền thẳng cho onSelectDay
};

// Dữ liệu 1 tháng được tính TRƯỚC 1 lần: ô ngày (đã kèm key + số ngày để render
// khỏi đụng moment), mốc ngày đầu/cuối (so trùng range nhanh trong memo) và
// height (để getItemLayout không phải dựng lại lưới). Bản cũ gọi buildMonthGrid
// lặp lại nhiều lần (MonthGrid + getMonthBlockHeight + getDayRowOffsetInMonth +
// getItemLayout) — giờ gom về đúng 1 lần cho mỗi tháng.
type MonthModel = {
  key: string; // 'YYYY-MM'
  title: string; // 'MM/YYYY'
  firstDayKey: string; // 'YYYY-MM-DD'
  lastDayKey: string; // 'YYYY-MM-DD'
  cells: Array<DayCell | null>;
  height: number;
};

function buildMonthModel(month: moment.Moment): MonthModel {
  const startOfMonth = month.clone().startOf('month');
  const daysInMonth = month.daysInMonth();
  const leadingEmpty = startOfMonth.day();

  const cells: Array<DayCell | null> = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = startOfMonth.clone().date(day);
    cells.push({
      key: date.format('YYYY-MM-DD'),
      dateNumber: day,
      date,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rowCount = cells.length / 7;
  const monthKey = startOfMonth.format('YYYY-MM');

  return {
    key: monthKey,
    title: startOfMonth.format('MM/YYYY'),
    firstDayKey: `${monthKey}-01`,
    lastDayKey: startOfMonth.clone().date(daysInMonth).format('YYYY-MM-DD'),
    cells,
    height: MONTH_TITLE_HEIGHT + rowCount * DAY_ROW_HEIGHT + MONTH_GAP,
  };
}

function toDayKey(timestamp: number) {
  return moment.tz(timestamp, WORK_SHIFT_TIMEZONE).format('YYYY-MM-DD');
}

// Chọn ngày mục tiêu để mở lịch tới: nếu hôm nay nằm trong khoảng đang chọn thì
// tới hôm nay; ngược lại tới ngày bắt đầu khoảng. Tháng chứa ngày này sẽ được
// cuộn tới (scrollToOffset) sau khi sheet mở xong.
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

type MonthGridProps = {
  model: MonthModel;
  todayKey: string;
  rangeStartKey: string | null;
  rangeEndKey: string | null;
  onSelectDay: (date: moment.Moment) => void;
};

function MonthGridComponent({
  model,
  todayKey,
  rangeStartKey,
  rangeEndKey,
  onSelectDay,
}: MonthGridProps) {
  return (
    <View className="mb-5">
      <Text className="mb-3 text-sm font-semibold text-gray-800">
        Tháng {model.title}
      </Text>
      <View className="flex-row flex-wrap">
        {model.cells.map((cell, index) => {
          if (!cell) {
            return (
              <View
                key={`empty-${index}`}
                className="w-[14.28%] aspect-square"
              />
            );
          }

          const { key, dateNumber, date } = cell;
          const isToday = key === todayKey;
          // Bao gồm cả 2 đầu mút (giống isInSelectedRange bản cũ); nền/chữ vẫn
          // ưu tiên isEdge trước nên hiển thị không đổi.
          const isRange =
            rangeStartKey != null &&
            rangeEndKey != null &&
            key >= rangeStartKey &&
            key <= rangeEndKey;
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
                  {dateNumber}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Một tháng chỉ đổi giao diện khi khoảng chọn CHẠM vào chính tháng đó. Nhờ
// comparator này, một lần đổi ngày KHÔNG bắt cả 4 tháng re-render — chỉ tháng bị
// range cũ/mới đụng tới.
function monthTouchesRange(
  model: MonthModel,
  startKey: string | null,
  endKey: string | null,
) {
  if (!startKey || !endKey) return false;
  return model.lastDayKey >= startKey && model.firstDayKey <= endKey;
}

function areMonthPropsEqual(prev: MonthGridProps, next: MonthGridProps) {
  if (prev.model !== next.model) return false;
  if (prev.todayKey !== next.todayKey) return false;
  if (prev.onSelectDay !== next.onSelectDay) return false;
  if (
    prev.rangeStartKey === next.rangeStartKey &&
    prev.rangeEndKey === next.rangeEndKey
  ) {
    return true;
  }

  const prevTouch = monthTouchesRange(
    next.model,
    prev.rangeStartKey,
    prev.rangeEndKey,
  );
  const nextTouch = monthTouchesRange(
    next.model,
    next.rangeStartKey,
    next.rangeEndKey,
  );

  // Range đổi nhưng không đụng tháng này (cả cũ lẫn mới) → giao diện y hệt → skip.
  return !(prevTouch || nextTouch);
}

const MonthGrid = memo(MonthGridComponent, areMonthPropsEqual);

const WorkShiftDatePickerBottomSheet = forwardRef<
  WorkShiftDatePickerBottomSheetRef,
  Props
>(({ onSelect }, ref) => {
  const [visible, setVisible] = useState(false);
  // Ẩn lịch cho tới khi đã cuộn tới đúng tháng (sau khi sheet mở xong) rồi mới
  // hiện → không thấy cú "nhảy" ~2 tháng lúc định vị.
  const [calendarReady, setCalendarReady] = useState(false);
  const [draftStart, setDraftStart] = useState<number | null>(null);
  const [draftEnd, setDraftEnd] = useState<number | null>(null);
  // Ngày mục tiêu để NEO list khi mở. Đặt 1 lần trong present() và giữ cố định
  // suốt phiên → chọn ngày không làm list re-anchor/remount.
  const [scrollTargetDayKey, setScrollTargetDayKey] = useState<string | null>(
    null,
  );
  const sheetRef = useRef<any>(null);
  const listRef = useRef<any>(null);
  // Chỉ cuộn-định-vị ĐÚNG 1 lần mỗi phiên mở (onChange có thể bắn lại).
  const hasScrolledRef = useRef(false);
  // Bản mới nhất của draft để handleSelectDay giữ identity ổn định (useCallback
  // rỗng) → prop onSelectDay không đổi → comparator của MonthGrid lọc được đúng
  // tháng cần render thay vì re-render cả 4 tháng mỗi lần chạm.
  const draftStartRef = useRef<number | null>(draftStart);
  const draftEndRef = useRef<number | null>(draftEnd);
  draftStartRef.current = draftStart;
  draftEndRef.current = draftEnd;

  const todayKey = useMemo(
    () => moment.tz(WORK_SHIFT_TIMEZONE).format('YYYY-MM-DD'),
    [visible],
  );

  // Cửa sổ CỐ ĐỊNH quanh HÔM NAY: today−2 … today … today+2. Tháng today luôn ở
  // index MONTHS_BACK. Neo theo today (không theo ngày chọn) đúng yêu cầu "từ
  // today render 2 tháng trước & 2 tháng sau".
  const months = useMemo<MonthModel[]>(() => {
    const anchor = moment
      .tz(todayKey, 'YYYY-MM-DD', WORK_SHIFT_TIMEZONE)
      .startOf('month')
      .subtract(MONTHS_BACK, 'month');

    return Array.from(
      { length: MONTHS_BACK + MONTHS_FORWARD + 1 },
      (_, index) => buildMonthModel(anchor.clone().add(index, 'month')),
    );
  }, [todayKey]);

  // Offset luỹ kế dựng sẵn cho getItemLayout (1 lần / mỗi lần đổi months).
  const itemOffsets = useMemo(() => {
    let offset = 0;
    return months.map((month) => {
      const current = offset;
      offset += month.height;
      return current;
    });
  }, [months]);

  // Vị trí mở: tháng của ngày mục tiêu (ngày chọn hoặc hôm nay), kẹp trong cửa
  // sổ. Mặc định = tháng hôm nay (index MONTHS_BACK) khi chưa có ngày mục tiêu
  // hoặc ngày đó rơi ngoài cửa sổ today ± 2.
  const targetMonthIndex = useMemo(() => {
    if (!scrollTargetDayKey) return MONTHS_BACK;
    const monthKey = scrollTargetDayKey.slice(0, 7);
    const index = months.findIndex((month) => month.key === monthKey);
    return index < 0 ? MONTHS_BACK : index;
  }, [months, scrollTargetDayKey]);

  // Offset cuộn tới đầu tháng mục tiêu (dùng đúng itemOffsets mà getItemLayout
  // dùng → nhất quán).
  const targetOffset = itemOffsets[targetMonthIndex] ?? 0;

  // Ref ổn định cho style ẩn/hiện lịch (tránh object inline gây render loop).
  const listStyle = useMemo(
    () => ({ opacity: calendarReady ? 1 : 0 }),
    [calendarReady],
  );

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

  const handleClose = useCallback(() => {
    setVisible(false);
    setDraftStart(null);
    setDraftEnd(null);
    setScrollTargetDayKey(null);
    setCalendarReady(false);
    hasScrolledRef.current = false;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      present: ({ startTimestamp, endTimestamp }: WorkShiftDateRange) => {
        const currentTodayKey = moment
          .tz(WORK_SHIFT_TIMEZONE)
          .format('YYYY-MM-DD');
        setDraftStart(startTimestamp);
        setDraftEnd(endTimestamp);
        setScrollTargetDayKey(
          getScrollTargetDayKey(startTimestamp, endTimestamp, currentTodayKey),
        );
        hasScrolledRef.current = false;
        setCalendarReady(false);
        setVisible(true);
        // Double-RAF (ở đây + trong SBottomSheet.present): commit months + mount
        // list TRƯỚC khi sheet animate; định vị tháng mục tiêu ở onChange (settle).
        requestAnimationFrame(() => {
          sheetRef.current?.present();
        });
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
        handleClose();
      },
    }),
    [handleClose],
  );

  const handleSelectDay = useCallback((date: moment.Moment) => {
    const timestamp = date.clone().startOf('day').valueOf();
    const currentStart = draftStartRef.current;
    const currentEnd = draftEndRef.current;

    if (currentStart == null || currentEnd != null) {
      setDraftStart(timestamp);
      setDraftEnd(null);
      return;
    }

    const startMoment = moment.tz(currentStart, WORK_SHIFT_TIMEZONE);
    if (date.isBefore(startMoment, 'day')) {
      setDraftStart(timestamp);
      setDraftEnd(null);
      return;
    }

    setDraftEnd(date.clone().endOf('day').valueOf());
  }, []);

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

  // Sheet settle (index >= 0) = scrollable đã UNLOCK → cuộn ĐÚNG 1 lần (tức
  // thời) tới tháng mục tiêu, rồi mới hiện lịch. rAF thứ nhất: chắc chắn đã unlock
  // + đã cuộn; rAF thứ hai: hiện sau khi khung đã ở đúng vị trí → không thấy nhảy.
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index < 0 || hasScrolledRef.current) return;
      hasScrolledRef.current = true;
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: targetOffset,
          animated: false,
        });
        requestAnimationFrame(() => setCalendarReady(true));
      });
    },
    [targetOffset],
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
    (_: ArrayLike<MonthModel> | null | undefined, index: number) => ({
      length: months[index]?.height ?? 0,
      offset: itemOffsets[index] ?? 0,
      index,
    }),
    [itemOffsets, months],
  );

  const renderMonth = useCallback(
    ({ item }: { item: MonthModel }) => (
      <MonthGrid
        model={item}
        todayKey={todayKey}
        rangeStartKey={rangeStartKey}
        rangeEndKey={rangeEndKey}
        onSelectDay={handleSelectDay}
      />
    ),
    [handleSelectDay, rangeEndKey, rangeStartKey, todayKey],
  );

  const keyExtractor = useCallback((month: MonthModel) => month.key, []);

  // Báo FlatList chạy lại renderItem khi range/today đổi; MonthGrid.memo mới là
  // chốt quyết định tháng nào THỰC SỰ render lại.
  const extraData = useMemo(
    () => `${rangeStartKey}|${rangeEndKey}|${todayKey}`,
    [rangeEndKey, rangeStartKey, todayKey],
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
        <Button
          label="Áp dụng"
          onPress={handleConfirm}
          disabled={draftStart == null}
        />
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

      {/*
        Định vị tháng mục tiêu bằng scrollToOffset ở onChange (sau khi sheet mở
        xong = scrollable đã unlock), ĐÚNG 1 lần, tức thời. KHÔNG dùng
        contentOffset/initialScrollIndex vì chúng làm ĐƠ scroll trong
        BottomSheetFlatList. Lịch ẩn (opacity 0 qua listStyle) tới khi cuộn xong
        mới hiện → không thấy cú nhảy. initialNumToRender phủ tới tháng today để
        khung mục tiêu đã render sẵn trước khi cuộn (khỏi chớp trắng). key đổi
        theo ngày mục tiêu → mỗi present() remount sạch.
      */}
      <BottomSheetFlatList
        ref={listRef}
        key={scrollTargetDayKey ?? 'calendar'}
        data={months}
        keyExtractor={keyExtractor}
        renderItem={renderMonth}
        extraData={extraData}
        getItemLayout={getItemLayout}
        style={listStyle}
        initialNumToRender={MONTHS_BACK + 1}
        maxToRenderPerBatch={2}
        windowSize={5}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={CONTENT_CONTAINER_STYLE}
      />
    </SBottomSheet>
  );
});

export default WorkShiftDatePickerBottomSheet;
