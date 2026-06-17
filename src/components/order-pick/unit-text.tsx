import React, { memo, useMemo } from 'react';
import { Text, type TextProps } from 'react-native';

const BASE_UNIT_REGEX = /(\([^)]*\))/;
const NAME_WITH_PARENS_REGEX = /^(.+?)\s*\((.+)\)\s*$/;
const PARENS_ONLY_REGEX = /^\((.+)\)$/;

export function parseOrderQuantityConversionUnit(
  unit: string,
): { name: string; range: string } | null {
  const trimmed = unit.trim();
  if (!trimmed) return null;

  const withName = trimmed.match(NAME_WITH_PARENS_REGEX);
  if (withName) {
    const name = withName[1].trim();
    let inner = withName[2].trim();

    if (inner.includes('/')) {
      const slashIdx = inner.lastIndexOf('/');
      inner = inner.slice(0, slashIdx).trim();
    }

    return { name, range: inner };
  }

  const onlyParen = trimmed.match(PARENS_ONLY_REGEX);
  if (onlyParen) {
    const inner = onlyParen[1];
    const slashIdx = inner.lastIndexOf('/');

    if (slashIdx !== -1) {
      return {
        name: inner.slice(slashIdx + 1).trim(),
        range: inner.slice(0, slashIdx).trim(),
      };
    }
  }

  return null;
}

/** "Bắp (0.25 - 0.4KG)" → "Bắp (0.25 - 0.4KG / Bắp)" */
export function formatOrderQuantityConversionUnit(unit: string): string {
  const parsed = parseOrderQuantityConversionUnit(unit);
  if (!parsed) return unit.trim();

  const { name, range } = parsed;
  return `${name} (${range} / ${name})`;
}

type UnitTextProps = TextProps & {
  unit: string;
  className?: string;
  orderQuantityConversion?: boolean;
};

export const UnitText = memo(function UnitText({
  unit,
  className = '',
  style,
  orderQuantityConversion = false,
  ...textProps
}: UnitTextProps) {
  const displayUnit = useMemo(() => {
    if (!orderQuantityConversion) return unit;
    return formatOrderQuantityConversionUnit(unit);
  }, [unit, orderQuantityConversion]);

  const parts = useMemo(() => {
    if (orderQuantityConversion) {
      const match = displayUnit.match(/^(.+?)\s*(\(.+\))$/);
      if (!match) return null;

      return {
        before: `${match[1]} `,
        highlighted: match[2],
        after: '',
      };
    }

    const match = displayUnit.match(BASE_UNIT_REGEX);
    if (!match || match.index === undefined) return null;

    const index = match.index;
    return {
      before: displayUnit.slice(0, index),
      highlighted: match[0],
      after: displayUnit.slice(index + match[0].length),
    };
  }, [displayUnit, orderQuantityConversion]);

  if (!parts) {
    return (
      <Text className={className} style={style} {...textProps}>
        {displayUnit}
      </Text>
    );
  }

  return (
    <Text className={className} style={style} {...textProps}>
      {parts.before}
      {parts.highlighted}
      {parts.after}
    </Text>
  );
});
