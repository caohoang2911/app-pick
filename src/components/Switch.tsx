import { Switch as NativeSwitch } from 'react-native';
import { Platform } from 'react-native';

function Switch({
  ...props
}: React.ComponentPropsWithoutRef<typeof NativeSwitch>) {

  const thumbColor = props.thumbColor;
  const ios_backgroundColor =
    props.ios_backgroundColor ;

  return (
    <NativeSwitch
      trackColor={{ false: "#dfdfdf", true: "#3280f6" }}
      thumbColor={thumbColor}
      ios_backgroundColor={ios_backgroundColor}
      {...props}
      style={{ transform: Platform.OS === 'ios' ? [{ scaleX: .8 }, { scaleY: .8 }] : [] }}
    />
  );
}

export { Switch };
