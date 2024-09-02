import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
const ArrowDown = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" viewBox={`0 0 24 24`} {...props}>
    <Path
      fill={props.color || '#2D3748'}
      d="m12 13.172 4.95-4.95 1.414 1.414L12 16 5.636 9.636 7.05 8.222l4.95 4.95Z"
    />
  </Svg>
)
export default ArrowDown
