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
import { Ionicons } from "@expo/vector-icons";

const RowWithLabel = ({label, value}: {label: string, value: string}) => {
  return (
    <View className="flex flex-row">
      <View style={{width: 87}}><Text>{label}</Text></View>
      <Text className="font-semibold">{value}</Text>
    </View>
  )
}

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
  createdDate,
  groupShippingCode
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
  groupShippingCode: string;
}) => {
  const router = useRouter();

  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

  const handlePress = () => {
    if(type === 'HOME_DELIVERY') {
      router.push(`orders/order-invoice/${code}`);
    } else {
      router.push({ pathname: `orders/order-detail/${code}`, params: { status } });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View className="rounded-md border-bgPrimary border">
        <View className="bg-bgPrimary p-4 flex flex-row justify-between items-center">
          <View className="flex flex-row items-center gap-2">
            <Text className="font-semibold text-base text-colorPrimary">
              {code}
            </Text>
            {groupShippingCode && <Badge label={groupShippingCode} variant="warning" />}
          </View>
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
            <RowWithLabel label="Khách hàng" value={customer?.name} />
            <RowWithLabel label="Giá trị đơn" value={formatCurrency(amount, {unit: true})} />
            <RowWithLabel label="Giao hàng" value={`${expectedDeliveryTime(expectedDeliveryTimeRange).hh} - ${expectedDeliveryTime(expectedDeliveryTimeRange).day}`} />
            <RowWithLabel label="Ngày đặt" value={moment(createdDate).format('DD/MM/YYYY')} />
            {tags?.length > 0 && 
              <View className="pt-1 flex flex-row gap-2 flex-wrap">
                {tags?.map((tag: string, index: number) => {
                  const tagName = getConfigNameById(orderTags, tag)
                  return <>
                    <Badge key={index} label={tagName as string || tag} variant={tag?.startsWith("ERROR") ? "danger" : "default"} className="self-start rounded-md"/>
                  </>
                })}
              </View>
            }
            {note && (
              <View className="flex flex-row items-center gap-1 mt-1">
                <Ionicons name="information-circle-outline" size={15} color="#f97316" />
                <Text className="text-sm text-orange-500 italic">{note}</Text>
              </View>
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