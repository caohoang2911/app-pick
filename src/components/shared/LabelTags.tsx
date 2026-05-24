import React, { memo } from 'react';
import { View } from 'react-native';
import { ORDER_STATUS_BADGE_VARIANT } from '@/core/constants/order';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import { cn } from '@/lib/utils';
import { Badge } from '../Badge';

export type LabelTagsProps = {
  tags?: string[];
  className?: string;
};

const LabelTags = ({ tags, className }: LabelTagsProps) => {
  const configs = useConfig.use.config();
  const orderTags = configs?.orderTags || [];

  if (!tags?.length) {
    return null;
  }

  return (
    <View className={cn('flex flex-row gap-1 flex-wrap', className)}>
      {tags.map((tag) => {
        const tagName = getConfigNameById(orderTags, tag);
        return (
          <Badge
            className="self-start rounded-md"
            key={tag}
            label={tagName as string}
            style={{ marginHorizontal: 0 }}
            variant={
              ORDER_STATUS_BADGE_VARIANT[
                tag as keyof typeof ORDER_STATUS_BADGE_VARIANT
              ] as any
            }
          />
        );
      })}
    </View>
  );
};

export default memo(LabelTags);
