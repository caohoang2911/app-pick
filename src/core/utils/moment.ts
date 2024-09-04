import moment from 'moment';

export const initConfigDate = () => {
  moment.updateLocale('en', {
    relativeTime: {
      future: 'cách đây %s',
      past: '%s trước',
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
