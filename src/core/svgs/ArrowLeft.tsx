import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';

const ArrowLeft = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Path
      fill="#2D3748"
      d="m10.828 12 4.95 4.95-1.414 1.414L8 12l6.364-6.364 1.414 1.414-4.95 4.95Z"
    />
  </Svg>
);
export default ArrowLeft;
