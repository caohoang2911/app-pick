import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, Text, View, StyleSheet, InteractionManager } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from "react-native-view-shot";
import { showAlert } from '~/src/core/store/alert-dialog';
import { useOrderBag } from '~/src/core/store/order-bag';
import { expectedDeliveryTime } from '~/src/core/utils/moment';
import { formatCurrency } from '~/src/core/utils/number';
import { OrderBagLabel, OrderBagType } from '~/src/types/order-bag';

const WIDTH_LABEL = 472;
const HEIGHT_LABEL = 315;

const WIDTH = Dimensions.get('window').width - 20;
const HEIGHT = WIDTH * HEIGHT_LABEL / WIDTH_LABEL;

const LabelPrintTemplate = React.memo(({ 
  setUri, 
  code, 
  name, 
  total, 
  type,
  index = 0, 
  bagLabelsPrint,
}: { 
  setUri: (uri: string) => void, 
  setRef: (ref: any) => void,
  code: string, 
  name: string, 
  total: number,
  type: OrderBagType,
  index?: number,
  bagLabelsPrint?: any[],
}) => {
  const ref = useRef<ViewShot>(null);
  const [isLayoutComplete, setIsLayoutComplete] = useState(false);

  const orderDetail = useOrderBag.use.orderDetail();
  const { header } = orderDetail || {};

  const totalBags = bagLabelsPrint?.filter((item: any) => item.type === type)?.length || 0;


  const { customer, deliveryAddress, deliveryTimeRange, codAmount } = header || {};
  const { name: customerName, phone } = customer || {};
  const { fullAddress } = deliveryAddress || {};

  // Phương pháp 1: Sử dụng onLayout để biết khi nào layout đã hoàn thành
  const handleLayout = () => {
    console.log(`[${index}] Layout hoàn thành`);
    setIsLayoutComplete(true);
  };

  useEffect(() => {
    let timer: any;
    if (isLayoutComplete) {
      console.log(`[${index}] Tất cả điều kiện đã thỏa mãn, component đã sẵn sàng`);

      try {
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
          (error) => {
            console.error("Oops, snapshot failed", error)
            showAlert({
              title: "Oops, snapshot failed captureRef",
              message: JSON.stringify(error),
              onConfirm: () => {},
            });
          }
        );
      } catch (error) {
        showAlert({
          title: "Oops, snapshot failed throw error",
          message: JSON.stringify(error),
          onConfirm: () => {},
        });
      }
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLayoutComplete]);

  return (
    <>
      <ViewShot ref={ref}>
        <View 
          style={{width: WIDTH, height: HEIGHT, backgroundColor: 'transparent'}}
          onLayout={handleLayout}
        >
          <View style={{ padding: 10 }}>
            <View style={styles.headerRow}>
              <Text style={styles.titleText} allowFontScaling={false}>{`${name}/${totalBags}`}</Text>
              <Text style={[styles.titleText, { marginRight: 15 }]} allowFontScaling={false}>{total} túi</Text>
            </View>
            <View style={styles.contentRow}>
              <View style={{marginLeft: 10}}>
                <QRCode 
                  value={code} 
                  size={90} 
                  backgroundColor="transparent" 
                />
              </View>
              <View style={styles.customerInfoContainer}>
                <View>
                  <Text style={styles.customerNameText} allowFontScaling={false}>{customerName}</Text> 
                  <Text style={styles.customerNameText} allowFontScaling={false}>*******{phone?.slice(-3)}</Text> 
                  <Text style={styles.codText} allowFontScaling={false}>COD: {formatCurrency(codAmount, {unit: true})}</Text> 
                </View>
                <Text style={styles.codeText} allowFontScaling={false}>{code}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.infoText} allowFontScaling={false}>Ngày giao: {deliveryTimeRange ? `${expectedDeliveryTime(deliveryTimeRange).hh} - ${expectedDeliveryTime(deliveryTimeRange).day}` : '--'}</Text> 
              <Text style={styles.infoText} allowFontScaling={false}>Địa chỉ: {fullAddress || '--'}</Text> 
            </View>
          </View>
        </View>
      </ViewShot>
    </>
  );
});

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  customerInfoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  customerNameText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  codText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  codeText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default LabelPrintTemplate;
