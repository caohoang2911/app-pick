import moment from 'moment';
import momentTimezone from 'moment-timezone';
export const initConfigDate = () => {
  moment.updateLocale('en', {
    relativeTime: {
      future: '%s',
      past: '%s',
      s: 'vài giây',
      ss: '%d giây',
      m: '1 phút',
      mm: '%d phút',
      h: '1 giờ',
      hh: '%d giờ',
      d: '1 ngày',
      dd: '%d ngày',
      M: '1 tháng',
      MM: '%d tháng',
      y: '1 năm',
      yy: '%d năm',
    },
  });
}

export const setDefaultTimeZone = () => {
  return momentTimezone.tz.setDefault('Asia/Ho_Chi_Minh');
}

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
