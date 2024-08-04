import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';
const TruckLine = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Path
      fill="#2D3748"
      d="M8.965 18a3.5 3.5 0 0 1-6.93 0H1V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2h3l3 4.056V18h-2.035a3.5 3.5 0 0 1-6.93 0h-5.07ZM15 7H3v8.05a3.5 3.5 0 0 1 5.663.95h5.674c.168-.353.393-.674.663-.95V7Zm2 6h4v-.285L18.992 10H17v3Zm.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM7 17.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"
    />
  </Svg>
);
export default TruckLine;