import moment from 'moment';
import momentTimezone from 'moment-timezone';
// export const initConfigDate = () => {
//   moment.updateLocale('en', {
//     relativeTime: {
//       future: '%s',
//       past: '%s',
//       s: 'vài giây',
//       ss: '%d giây',
//       m: '1 phút',
//       mm: '%d phút',
//       h: '1 giờ',
//       hh: '%d giờ',
//       d: '1 ngày',
//       dd: '%d ngày',
//       M: '1 tháng',
//       MM: '%d tháng',
//       y: '1 năm',
//       yy: '%d năm',
//     },
//   });
// }

export const setDefaultTimeZone = () => {
  return momentTimezone.tz.setDefault('Asia/Ho_Chi_Minh');
}

export const getRelativeTime = (
  lastTime: string | Date | number | null | undefined
): string => {
  if (!lastTime) return '';

  const now = moment();
  const inputTime = moment(lastTime);
  const duration = moment.duration(now.diff(inputTime));

  const minutes = Math.floor(duration.asMinutes());
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const days = Math.floor(minutes / (60 * 24));
  const months = Math.floor(minutes / (60 * 24 * 30));
  const years = Math.floor(minutes / (60 * 24 * 365));

  if (minutes < 1) return 'vài giây';
  if (minutes < 60) return `${minutes} phút`;
  if (minutes < 24 * 60) {
    if (remainingMinutes === 0) return `${hours} giờ`;
    return `${hours} giờ ${remainingMinutes} phút`;
  }
  if (minutes < 30 * 24 * 60) return `${days} ngày`;
  if (minutes < 12 * 30 * 24 * 60) return `${months} tháng`;
  return `${years} năm`;
};

export const expectedDeliveryTime = (deliveryTimeRange: Array<any>): any => {
  const startTime = deliveryTimeRange?.[0];
  const endTime = deliveryTimeRange?.[1];

  if (!startTime || !endTime) return '-';
  if (moment(startTime).valueOf() === moment(endTime).valueOf())
    return moment(startTime).format('HH:mm') + ' - ';
  return {
    day: moment(startTime).format('DD/MM/YYYY'),
    hh:
      moment(startTime).format('HH:mm') +
      ' - ' +
      moment(endTime).format('HH:mm'),
  };
};

export const isTimestampExpired = (timestamp: number): boolean => {
  const now = Date.now();
  return timestamp < now;
};
