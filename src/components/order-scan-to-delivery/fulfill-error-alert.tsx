import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { FULFILL_ERROR_TYPE } from '@/core/constants/order';
import { MarkdownText } from '@/core/utils/markdown';
import { SectionAlert } from '~/src/components/SectionAlert';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import { Options } from '~/src/types/commons';
import { OrderDetailHeader } from '~/src/types/order-pick';

// Ref ổn định để deps của useMemo không đổi mỗi lần render.
const EMPTY_FULFILL_ERROR_TYPES: Options = [];
const EMPTY_MESSAGES: string[] = [];

interface FulfillErrorAlertProps {
  fulfillError?: OrderDetailHeader['fulfillError'];
}

/**
 * Block lỗi fulfill trên màn scan túi giao (khách / tài xế) — chỉ hiện khi
 * type = ERROR_STORE_PICKED_INCORRECT_ORDER để siêu thị aware trước khi giao.
 */
const FulfillErrorAlert = memo(({ fulfillError }: FulfillErrorAlertProps) => {
  const config = useConfig.use.config();
  const fulfillErrorTypes: Options =
    config?.fulfillErrorTypes || EMPTY_FULFILL_ERROR_TYPES;

  const { type, messages } = fulfillError || {};

  const title = useMemo(
    () => getConfigNameById(fulfillErrorTypes, type) || type || '',
    [fulfillErrorTypes, type],
  );

  const errorMessages = useMemo(
    () => messages?.filter(Boolean) || EMPTY_MESSAGES,
    [messages],
  );

  if (type !== FULFILL_ERROR_TYPE.STORE_PICKED_INCORRECT_ORDER) return null;

  if (!title && !errorMessages.length) return null;

  return (
    <View className="px-4" style={{ marginBottom: 10 }}>
      <SectionAlert variant="danger">
        {!!title && (
          <Text className="text-base font-bold text-red-600">{title}</Text>
        )}
        {errorMessages.map((message, index) => (
          <View
            key={`${index}-${message}`}
            className={`flex flex-row items-start ${
              title || index > 0 ? 'mt-2' : ''
            }`}
          >
            <View className="mr-2 mt-[7px] h-[4px] w-[4px] rounded-full bg-red-600" />
            <View className="flex-1">
              <MarkdownText
                textStyle={{
                  color: '#dc2626',
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                {message}
              </MarkdownText>
            </View>
          </View>
        ))}
      </SectionAlert>
    </View>
  );
});

FulfillErrorAlert.displayName = 'FulfillErrorAlert';

export default FulfillErrorAlert;
