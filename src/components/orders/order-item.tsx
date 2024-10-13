import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useConfig } from "~/src/core/store/config";
import { Badge } from "../Badge";
import moment from 'moment';
import { formatCurrency } from "~/src/core/utils/number";
import { getConfigNameById } from "~/src/core/utils/config";
import { expectedDeliveryTime } from "~/src/core/utils/moment";
import { toLower } from "lodash";
import MoreActionsBtn from "./more-actions-btn";
import { OrderStatus } from "~/src/types/order";

const OrderItem = ({
  statusName,
  orderTime,
  code,
  status,
  customer,
  selectedOrderCounter,
  expectedDeliveryTimeRange,
  amount,
  tags,
  note,
  payment,
  type,
}: {
  statusName: string;
  orderTime: string;
  code: string;
  status: OrderStatus;
  customer: any;
  selectedOrderCounter?: OrderStatus;
  expectedDeliveryTimeRange?: any;
  createdDate: string;
  amount: number;
  tags: Array<any>;
  note: string;
  payment: any;
  type: string;
}) => {
  const router = useRouter();

  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

  return (
    <TouchableOpacity
      onPress={() => {
        if(type === 'HOME_DELIVERY') {
          router.push(`orders/order-invoice/${code}`);
        } else {
          router.push({ pathname: `orders/order-detail/${code}`, params: { status } });
        }
      }}
    >
      <View className="rounded-md border-bgPrimary border">
        <View className="bg-bgPrimary p-4 flex flex-row justify-between items-center">
          <Text className="font-semibold text-base text-colorPrimary">
            # {code}
          </Text>
          <Badge
            label={selectedOrderCounter === 'ALL' ? statusName : ''}
            extraLabel={
              <Text className="text-xs text-contentPrimary">{selectedOrderCounter === 'ALL' && ` | `}
                {moment(orderTime).fromNow()}
              </Text>
            } 
            variant={toLower(status) as any}
          />
        </View>
        <View className="flex flex-row justify-between">
          <View className="p-4 pt-2 gap-1">
            <View className="flex flex-row">
              <View style={{width: 87}}>
                <Text>Khách hàng</Text>
              </View>
              <Text className="font-semibold">{customer?.name}</Text>
            </View>
            <View className="flex flex-row items-center">
              <View style={{width: 87}}>
                <Text className="">Giá trị đơn</Text>
              </View>
              <View className="flex flex-row items-center gap-2">
                <Text>
                  <Text className="font-semibold">
                  {formatCurrency(amount, {unit: true})}
                  </Text>
                </Text>
                {payment?.methodName && <Badge label={payment?.methodName} />}
              </View>
            </View>
            <View className="flex flex-row items-center">
              <View style={{width: 87}}>
                <Text>Giao hàng</Text>
              </View>
              <Text className="font-semibold">
                {expectedDeliveryTime(expectedDeliveryTimeRange).hh}
                - {' '}
                &nbsp;{expectedDeliveryTime(expectedDeliveryTimeRange).day} 
              </Text>
            </View>
            {tags?.length > 0 && 
              <View className="pt-1 flex flex-row gap-2">
                {tags?.map((tag: string, index: number) => {
                  const tagName = getConfigNameById(orderTags, tag)
                  return <>
                    <Badge key={index} label={tagName as string || tag} variant={tag?.startsWith("ERROR") ? "danger" : "default"} className="self-start rounded-md"/>
                  </>
                })}
              </View>
            }
            {note && (
              <Text className="text-sm text-gray-500" numberOfLines={1}>{note}</Text>
            )}
          </View>
          <View className="mt-3 mr-1">
            <MoreActionsBtn code={code} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default OrderItem;