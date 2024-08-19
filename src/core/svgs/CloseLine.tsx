import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
const CloseLine = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" viewBox="0 0 24 24" {...props}>
    <Path
      fill={props?.color || '#2D3748'}
      d="m12 10.586 4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636l4.95 4.95Z"
    />
  </Svg>
);
export default CloseLine;
