import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { MarkdownText } from '@/core/utils/markdown';

type ProductPickingGuidelinesProps = {
  guidelines: string[];
};

const ProductPickingGuidelines = ({
  guidelines,
}: ProductPickingGuidelinesProps) => {
  if (!guidelines.length) return null;

  return (
    <View className="rounded-md bg-orange-50 px-3 py-2 w-full">
      <Text className="text-orange-500 text-sm font-bold mb-1">
        LƯU Ý PICK HÀNG
      </Text>
      {guidelines.map((item) => (
        <View key={item} className="flex-row items-start gap-1">
          <Text className="text-orange-500 text-sm">{'\u2022'}</Text>
          <View className="flex-1">
            <MarkdownText
              textStyle={{
                color: '#f97316',
                fontStyle: 'normal',
                fontSize: 12,
                fontWeight: '500',
              }}
              linkStyle={{ color: '#c2410c' }}
            >
              {item}
            </MarkdownText>
          </View>
        </View>
      ))}
    </View>
  );
};

export default memo(ProductPickingGuidelines);
