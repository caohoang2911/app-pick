import React, { useEffect, useRef } from 'react';
import { Dimensions, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from "react-native-view-shot";
import { useOrderBag } from '~/src/core/store/order-bag';
import { expectedDeliveryTime } from '~/src/core/utils/moment';
import { formatCurrency } from '~/src/core/utils/number';

const WIDTH_LABEL = 472;
const HEIGHT_LABEL = 315;

const WIDTH = Dimensions.get('window').width - 20;
const HEIGHT = WIDTH * HEIGHT_LABEL / WIDTH_LABEL;

const  LabelPrintTemplate = React.memo(({ setUri, code, name, total }: { setUri: (uri: string) => void, code: string, name: string, total: number }) => {
  const ref = useRef<ViewShot>(null);

  const orderDetail = useOrderBag.use.orderDetail();
  const { header } = orderDetail || {};

  const { customer, deliveryAddress, deliveryTimeRange, codAmount } = header || {};
  const { name: customerName, phone } = customer || {};
  const { fullAddress } = deliveryAddress || {};

  useEffect(() => {
    setTimeout(() => {
      captureRef(ref, {
        format: "png",
        quality: 0.8,
        result: 'data-uri',
        width: WIDTH_LABEL,
        height: HEIGHT_LABEL,
      }).then(
        async (uri) => {
          setUri(uri)
        },
        (error) => console.error("Oops, snapshot failed", error)
      );
    }, 200);
  }, [ref]);

  return (
    <>
      <ViewShot ref={ref}>
        <View style={{width: WIDTH, height: HEIGHT, backgroundColor: 'transparent' }}>
          <View style={{ padding: 10 }}>
            <View className="flex flex-row justify-between">
              <Text className="text-2xl font-bold">{name}</Text>
              <Text className="text-2xl font-bold ">{total} túi</Text>
            </View>
            <View className="flex flex-row justify-between mt-3 gap-3">
              <QRCode value={code} size={100} backgroundColor="transparent" />
              <View className="flex-1 justify-between">
                <View>
                  <Text className="text-xl font-bold">{customerName}</Text> 
                  <Text className="text-xl font-bold">*******{phone?.slice(-3)}</Text> 
                  <Text className="text-lg font-bold">COD: {formatCurrency(codAmount, {unit: true})}</Text> 
                </View>
                <Text className="text-base mt-1 font-semibold">{code}</Text>
              </View>
            </View>
            <View>
              <Text className="text-base font-semibold mt-2">Ngày giao: {deliveryTimeRange ? `${expectedDeliveryTime(deliveryTimeRange).hh} - ${expectedDeliveryTime(deliveryTimeRange).day}` : '--'}</Text> 
              <Text className="text-base font-semibold">Địa chỉ: {fullAddress || '--'}</Text> 
            </View>
          </View>
        </View>
      </ViewShot>
    </>
  )
});

export default LabelPrintTemplate;
