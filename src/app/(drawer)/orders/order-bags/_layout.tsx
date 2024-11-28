

import { Stack } from "expo-router";
import Header from "~/src/components/shared/Header";
import { useOrderPick } from "~/src/core/store/order-pick";
import { OrderDetail } from "~/src/types/order-detail";

export default function OrderInvoiceLayout() {

  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail || {};
  const { status, tags } = header || {};

  // const isShowActionRight = status !== OrderStatusValue.SHIPPING && tags?.includes('ORDER_HOME_DELIVERY');
  const isShowActionRight = true;

  return (
    <Stack>
      <Stack.Screen
        name="[code]" 
        options={{ 
          headerShown: true,
          header: () => (
            <Header
              title="Nhập số lượng túi và in tem"
            />
          )
        }} 
      />
    </Stack>
  )
}