import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import TcpSocket from 'react-native-tcp-socket';
import { useGenRongtaPrintData } from '~/src/api/app-pick/use-gen-rongta-print-data';
import { useSetOrderPrintedBagLabel } from '~/src/api/app-pick/use-set-order-printed-bag-label';
import { queryClient } from '~/src/api/shared';
import LabelPrintTemplate from '~/src/components/print-preview/label-print-template';
import { useAuth } from '~/src/core';
import { getItem } from '~/src/core/storage';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { useOrderBag } from '~/src/core/store/order-bag';
import { OrderBagType } from '~/src/types/order-bag';

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

  const { mutate: setOrderPrintedBagLabel } = useSetOrderPrintedBagLabel(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
    setTimeout(() => {
      router.back();
    }, 300);
  });

  const refClient = useRef<any>(null);
  const hasPrintedRef = useRef<boolean>(false);
  const timeoutIdsRef = useRef<any[]>([]);
  const isCancelledRef = useRef<boolean>(false);

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
    if(!host) {
      showAlertError();
      return;
    }

    setLoading(true, connected ? "Đang xử lý ..." : "Đang kết nối máy in ...");
  }, [connected, host]);

  useEffect(() => {
    if(result.length === 0) return;
    
    if(result.length === bagLabelsPrint.length && connected) {
      const resultsBase64WithSorted = result.sort((a: any, b: any) => a.index - b.index).map((item: any) => item.uri);
      genRongtaPrintData({ base64Images: resultsBase64WithSorted });
    }
  }, [result, connected]);

  const showAlertError = useCallback(() => {
    showAlert({ 
      message: `Chưa cài đặt máy in`,
      onConfirm: () => {
        router.back();
        router.navigate('/settings');
        hideAlert();
      },
      confirmText: 'Cài đặt ngay',
      isHideCancelButton: true,
    });
  }, [host]);

  useEffect(() => {
    if(!host) return;

    let timer: any;
    
    try {
      refClient.current = TcpSocket.createConnection(options, () => {
        if (timer) {
          clearTimeout(timer);
        }
        setConnected(true);
      });

      timer = setTimeout(() => {
        setLoading(false);
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
      setConnected(false);
    }

    return () => {
      try {
        if (refClient.current) {
          refClient.current.destroy();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
      setLoading(false);
      setResult([]);
      hasPrintedRef.current = false;
      if(timer) {
        clearTimeout(timer);
      }
    }
  }, [host]);

  useEffect(() => {
    if (!printArrayData || !printArrayData.length || !connected || hasPrintedRef.current) {
      return;
    }
    hasPrintedRef.current = true;
    isCancelledRef.current = false;

    // 1. Marker: Đánh dấu đã in TRƯỚC KHI bắt đầu gửi
    if (code) {
      setOrderPrintedBagLabel({
        orderCode: code,
        labelCodes: bagLabelsPrint.map((item: any) => item.code),
      });
    }

    // 2. Send data: Gửi data tới máy in
    const writePromises = printArrayData.map((item: any, index: number) => {
      return new Promise<void>((resolve) => {
        const printData = new Uint8Array(item);
        const delay = 100 * (index + 1);
        const timeoutId = setTimeout(() => {
          if (!isCancelledRef.current && refClient.current) {
            try {
              refClient.current.write(printData);
            } catch (error) {
              // Ignore write errors
            }
          }
          resolve();
        }, delay);
        timeoutIdsRef.current.push(timeoutId);
      });
    });

    // Đợi tất cả các write hoàn thành
    Promise.all(writePromises).then(() => {
      if (isCancelledRef.current) return;

      setLoading(false);

      // 3. Unmount: Quay lại màn hình trước sau khi gửi xong
      const timeoutId1 = setTimeout(async () => {
        if (isCancelledRef.current) return;

        try {
          if (router.canGoBack()) {
            await queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
            router.back();
          }
        } catch (error) {
          // Ignore navigation errors
        }
      }, 500);
      timeoutIdsRef.current.push(timeoutId1);
    });

    return () => {
      // Cleanup không clear timeout để chúng có thể chạy
    };
  }, [printArrayData, connected]);

  // Cleanup riêng chỉ chạy khi component unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      timeoutIdsRef.current.forEach((id) => {
        if (id) {
          clearTimeout(id);
        }
      });
      timeoutIdsRef.current = [];
    };
  }, []);

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