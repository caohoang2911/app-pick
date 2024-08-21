import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
const SaveOutLine = (props: SvgProps) => (
  <Svg viewBox="0 0 24 24" width={24} height={24} fill="none" {...props}>
    <Path
      fill="#2D3748"
      d="M7 19v-6h10v6h2V7.828L16.172 5H5v14h2ZM4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 12v4h6v-4H9Z"
    />
  </Svg>
);
export default SaveOutLine;
