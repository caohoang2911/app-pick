import moment from 'moment-timezone';
import {
  WORK_SHIFT_PRESETS,
  type WorkShiftPreset,
} from '~/src/core/constants/work-shift';
import type { WorkShift } from '~/src/types/work-shift';

export const WORK_SHIFT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** CN → T7 theo moment().day() (0 = Chủ nhật). */
export const WORK_SHIFT_DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Số ngày hiển thị mặc định (tính cả ngày bắt đầu). */
export const WORK_SHIFT_DEFAULT_DAY_COUNT = 7;

export type WorkShiftDay = {
  key: string;
  date: moment.Moment;
  dayLabel: string;
  dateNumber: number;
  isToday: boolean;
  isPast: boolean;
};

export function buildWorkShiftTimeRange(
  fromDate?: moment.Moment,
  toDate?: moment.Moment,
) {
  const from = (fromDate ?? moment.tz(WORK_SHIFT_TIMEZONE))
    .clone()
    .startOf('day');
  const to = (
    toDate ?? from.clone().add(WORK_SHIFT_DEFAULT_DAY_COUNT - 1, 'days')
  )
    .clone()
    .endOf('day');

  return {
    fromDate: from.valueOf(),
    toDate: to.valueOf(),
    timeRangeFilter: `${from.valueOf()}-${to.valueOf()}`,
  };
}

export function getDefaultWorkShiftTimeRange() {
  return buildWorkShiftTimeRange();
}

export function getWorkShiftDayCount(
  fromTimestamp: number,
  toTimestamp: number,
) {
  const start = moment.tz(fromTimestamp, WORK_SHIFT_TIMEZONE).startOf('day');
  const end = moment.tz(toTimestamp, WORK_SHIFT_TIMEZONE).startOf('day');
  return end.diff(start, 'days') + 1;
}

export function buildWorkShiftDays(
  fromTimestamp = getDefaultWorkShiftTimeRange().fromDate,
  toTimestamp = getDefaultWorkShiftTimeRange().toDate,
): WorkShiftDay[] {
  const start = moment.tz(fromTimestamp, WORK_SHIFT_TIMEZONE).startOf('day');
  const end = moment.tz(toTimestamp, WORK_SHIFT_TIMEZONE).startOf('day');
  const dayCount = Math.max(1, end.diff(start, 'days') + 1);
  const todayKey = moment.tz(WORK_SHIFT_TIMEZONE).format('YYYY-MM-DD');

  return Array.from({ length: dayCount }, (_, index) => {
    const date = start.clone().add(index, 'day');
    const key = date.format('YYYY-MM-DD');

    return {
      key,
      date,
      dayLabel: WORK_SHIFT_DAY_LABELS[date.day()] ?? '',
      dateNumber: date.date(),
      isToday: key === todayKey,
      isPast: date.isBefore(moment.tz(WORK_SHIFT_TIMEZONE).startOf('day')),
    };
  });
}

export function formatWorkShiftHeaderRange(days: WorkShiftDay[]) {
  if (days.length === 0) return '';
  const first = days[0].date;
  const last = days[days.length - 1].date;
  return `${first.format('DD/MM')} - ${last.format('DD/MM YYYY')}`;
}

export function groupWorkShiftsByDay(shifts: WorkShift[]) {
  const map = new Map<string, WorkShift[]>();

  for (const shift of shifts) {
    const key = moment
      .tz(shift.startTime, WORK_SHIFT_TIMEZONE)
      .format('YYYY-MM-DD');
    const list = map.get(key) ?? [];
    list.push(shift);
    map.set(key, list);
  }

  for (const [, list] of map) {
    list.sort((a, b) => a.startTime - b.startTime);
  }

  return map;
}

export function formatWorkShiftTimeRange(startTime: number, endTime: number) {
  const start = moment.tz(startTime, WORK_SHIFT_TIMEZONE);
  const end = moment.tz(endTime, WORK_SHIFT_TIMEZONE);
  return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
}

export function getWorkShiftPresetForTimes(
  startTime: number,
  endTime: number,
): WorkShiftPreset | undefined {
  const start = moment.tz(startTime, WORK_SHIFT_TIMEZONE);
  const end = moment.tz(endTime, WORK_SHIFT_TIMEZONE);

  return WORK_SHIFT_PRESETS.find(
    (preset) =>
      start.hour() === preset.startHour &&
      start.minute() === preset.startMinute &&
      end.hour() === preset.endHour &&
      end.minute() === preset.endMinute,
  );
}

export function getWorkShiftPresetColor(
  startTime: number,
  endTime: number,
  index = 0,
) {
  return (
    getWorkShiftPresetForTimes(startTime, endTime)?.color ??
    WORK_SHIFT_PRESETS[index % WORK_SHIFT_PRESETS.length]?.color ??
    '#3280F6'
  );
}

export function buildWorkShiftTimes(dayKey: string, preset: WorkShiftPreset) {
  const base = moment.tz(dayKey, 'YYYY-MM-DD', WORK_SHIFT_TIMEZONE);
  const startTime = base
    .clone()
    .hour(preset.startHour)
    .minute(preset.startMinute)
    .second(0)
    .millisecond(0)
    .valueOf();
  const endTime = base
    .clone()
    .hour(preset.endHour)
    .minute(preset.endMinute)
    .second(0)
    .millisecond(0)
    .valueOf();

  return { startTime, endTime };
}
