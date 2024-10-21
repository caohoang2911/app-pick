

import { Stack } from "expo-router"
import HeaderActionBtn from "~/src/components/order-invoice/header-action-btn"
import Header from "~/src/components/shared/Header"
import { useOrderPick } from "~/src/core/store/order-pick";
import { OrderStatusValue } from "~/src/types/order";
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
        name="index" 
        options={{ 
          headerShown: true,
          header: () => (
            <Header
              title="Cài đặt"
            />
          )
        }} 
      />
    </Stack>
  )
}