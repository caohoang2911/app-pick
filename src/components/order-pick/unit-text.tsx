import React, { memo, useMemo } from 'react';
import { Text, type TextProps } from 'react-native';

const BASE_UNIT_REGEX = /(\([^)]*\))/;

type UnitTextProps = TextProps & {
  unit: string;
  className?: string;
};

export const UnitText = memo(function UnitText({
  unit,
  className = '',
  style,
  ...textProps
}: UnitTextProps) {
  const parts = useMemo(() => {
    const match = unit.match(BASE_UNIT_REGEX);
    if (!match || match.index === undefined) return null;

    const index = match.index;
    return {
      before: unit.slice(0, index),
      highlighted: match[0],
      after: unit.slice(index + match[0].length),
    };
  }, [unit]);

  if (!parts) {
    return (
      <Text className={className} style={style} {...textProps}>
        {unit}
      </Text>
    );
  }

  return (
    <Text className={className} style={style} {...textProps}>
      {parts.before}
      <Text >{parts.highlighted}</Text>
      {parts.after}
    </Text>
  );
});
