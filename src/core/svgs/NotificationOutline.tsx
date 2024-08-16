import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';

const NotificationOutline = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Path
      fill="#2D3748"
      d="M22 20H2v-2h1v-6.969C3 6.043 7.03 2 12 2s9 4.043 9 9.031V18h1v2ZM5 18h14v-6.969C19 7.148 15.866 4 12 4s-7 3.148-7 7.031V18Zm4.5 3h5a2.5 2.5 0 0 1-5 0Z"
    />
  </Svg>
);
export default NotificationOutline;
