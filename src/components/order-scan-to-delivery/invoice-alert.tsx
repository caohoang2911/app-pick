import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { SectionAlert } from '~/src/components/SectionAlert';
import { formatCurrency } from '~/src/core/utils/number';

interface InvoiceAlertProps {
  show: boolean;
  codAmount?: number | string | null;
}

const InvoiceAlert = memo(({ show, codAmount }: InvoiceAlertProps) => {
  if (!show) return null;

  return (
    <View className="px-4" style={{ marginBottom: 10 }}>
      <SectionAlert className="bg-yellow-500">
        <Text className="text-white font-semibold">
          • Đơn hàng chưa tạo hoá đơn. Vui lòng tạo hoá đơn trước khi giao hàng
        </Text>
        {Boolean(codAmount) && (
          <View className="mt-2">
            <Text className="text-white font-semibold">
              • Nhân viên siêu thị cần thu COD{' '}
              {formatCurrency(Number(codAmount) || 0, { unit: true })}
            </Text>
          </View>
        )}
      </SectionAlert>
    </View>
  );
});

InvoiceAlert.displayName = 'InvoiceAlert';

export default InvoiceAlert;
