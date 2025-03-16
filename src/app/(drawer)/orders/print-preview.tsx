import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import TcpSocket from 'react-native-tcp-socket';
import { useGenRongtaPrintData } from '~/src/api/app-pick/use-gen-rongta-print-data';
import LabelPrintTemplate from '~/src/components/print-preview/label-print-template';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { useOrderBag } from '~/src/core/store/order-bag';
import { OrderBagType } from '~/src/types/order-bag';
import { getItem } from '~/src/core/storage';
import { useConfig } from '~/src/core/store/config';
import { useAuth } from '~/src/core';
import { useSetOrderPrintedBagLabel } from '~/src/api/app-pick/use-set-order-printed-bag-label';

const TIMEOUT_CONNECT_PRINTER = 5000;

function PrintPreview() {
  const [result, setResult] = useState<any>([]);
  const [done, setIsDone] = useState(0);

  const [connected, setConnected] = useState(false);

  const orderBags = useOrderBag.use.orderBags();
  const { code, type, bagCode} = useLocalSearchParams<{ code?: string, type?: string, bagCode?: string }>();
  const findBagLabel = orderBags[type as OrderBagType]?.find((item: any) => item.code === bagCode);

  const orderBagsMerged = [...orderBags.DRY, ...orderBags.FRESH,  ...orderBags.FROZEN];

  const bagLabelsPrint = bagCode ? [{...findBagLabel}] : orderBagsMerged;

  const { mutate: setOrderPrintedBagLabel } = useSetOrderPrintedBagLabel();

  const refClient = useRef<any>(null);

  const config = useConfig.use.config();
  const stores = config?.stores || [];

  const user = useAuth.use.userInfo();
  const { storeCode } = user || {}

  const store: any = stores.find((store: any) => store.id === storeCode);
  const { printerIp } = store || {};

  const port = 9100;
  const host = getItem('ip') || printerIp;

  const options: any = {
    port: port,
    host: host,
  };

  const handleSetUri = useCallback((uri: string, index: number) => {
    setResult((prev: any) => [...prev, { uri, index }]);
  }, []);

  const { mutate: genRongtaPrintData, data } = useGenRongtaPrintData();

  const printArrayData = data?.data || [];

  useEffect(() => {
    setLoading(true, connected ? "Đang xử lý ..." : "Đang kết nối máy in ...");
  }, [connected]);

  useEffect(() => {
    if(result.length === 0) return;
    
    if(result.length === bagLabelsPrint.length && connected) {
      const resultsBase64WithSorted = result.sort((a: any, b: any) => a.index - b.index).map((item: any) => item.uri);
      genRongtaPrintData({ base64Images: resultsBase64WithSorted });
    }
  }, [result, connected]);

  useEffect(() => {
    let timer: any;
    
    try {
      refClient.current = TcpSocket.createConnection(options, () => {
        console.log('Connected to the server');
        if(timer) {
          clearTimeout(timer);
        }
        setConnected(true);
      });

      timer = setTimeout(() => {
        console.log('close');
        setLoading(false);
        setConnected(false);
        showAlert({ 
          message: `Không thể kết nối với máy in ${host}. Vui lòng kiểm tra lại.`,
          onConfirm: () => {
            router.back();
            hideAlert();
          },
          confirmText: 'Trở lại',
          isHideCancelButton: true,
        });
      }, TIMEOUT_CONNECT_PRINTER);
      
    } catch (error) {
      console.log(error);
      setConnected(false);
    }

    return () => {
      refClient.current.destroy();
      setLoading(false);
      setResult([]);
      if(timer) {
        clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    if(data && connected) {
      printArrayData.forEach((item: any) => {
        const printData = new Uint8Array(item);
        refClient.current.write(printData);
      });
      setTimeout(() => {
        router.back();
        if(code) {
          setOrderPrintedBagLabel({ orderCode: code, labelCodes: bagLabelsPrint.map((item: any) => item.code) });
        }
        refClient.current.destroy();
      }, 1000);
    }
  }, [data, connected]);

  return (
    <View style={{ padding: 10}} >
       <ScrollView>
          <View className='gap-3'>
            {bagLabelsPrint.slice(0, done + 1)?.map((item: any, index: number) => (
              <LabelPrintTemplate
                {...item}
                setUri={(uri: string) => {
                  setIsDone(done + 1);
                  handleSetUri(uri, index);
                }}
                key={index} 
                index={index}
                bagLabelsPrint={bagLabelsPrint}
                total={bagLabelsPrint.length}
              />
            ))}
          </View>
       </ScrollView>
    </View>
  )
}

export default PrintPreview;