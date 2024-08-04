import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';

const QRScanLine = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Path
      fill="#2D3748"
      d="M21 16v5H3v-5h2v3h14v-3h2ZM3 11h18v2H3v-2Zm18-3h-2V5H5v3H3V3h18v5Z"
    />
  </Svg>
);
export default QRScanLine;
