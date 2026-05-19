import { router, useLocalSearchParams } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from 'react';
import { ScrollView, Text, View } from 'react-native';
import TcpSocket from 'react-native-tcp-socket';
import { useGenRongtaPrintData } from '~/src/api/app-pick/use-gen-rongta-print-data';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useSetOrderPrintedBagLabel } from '~/src/api/app-pick/use-set-order-printed-bag-label';
import { queryClient } from '~/src/api/shared';
import LabelPrintTemplate from '~/src/components/print-preview/label-print-template';
import { useAuth } from '~/src/core';
import { getItem } from '~/src/core/storage';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { useOrderBag } from '~/src/core/store/order-bag';
import { getDeviceIpHintText } from '~/src/core/utils/printer-connection';
import { OrderBagType } from '~/src/types/order-bag';

const TIMEOUT_CONNECT_PRINTER = 5000;
const PRINT_DELAY = 300; // ms per item

function PrintPreview() {
  const [result, setResult] = useState<any>([]);
  const [done, setIsDone] = useState(0);

  const [connected, setConnected] = useState(false);

  const {
    code: orderCode,
    type,
    bagCode,
  } = useLocalSearchParams<{
    code?: string;
    type?: string;
    bagCode?: string;
  }>();
  const { isPending, isFetching } = useOrderDetailForCode(orderCode);

  const orderDetailProcessing = isPending || isFetching;

  const orderBags = useOrderBag.use.orderBags();

  const bagLabelsPrint = useMemo(() => {
    const merged = [...orderBags.DRY, ...orderBags.FRESH, ...orderBags.FROZEN];
    if (bagCode && type) {
      const found = orderBags[type as OrderBagType]?.find(
        (item: any) => item.code === bagCode,
      );
      return found ? [{ ...found }] : merged;
    }
    return merged;
  }, [orderBags, bagCode, type]);

  const { mutate: setOrderPrintedBagLabel } = useSetOrderPrintedBagLabel(
    () => {},
  );

  const refClient = useRef<any>(null);
  const hasPrintedRef = useRef<boolean>(false);
  const isCancelledRef = useRef<boolean>(false);

  const config = useConfig.use.config();
  const stores = config?.stores || [];

  const user = useAuth.use.userInfo();
  const { storeCode } = user || {};

  const store: any = stores.find((store: any) => store.id === storeCode);
  const { printerIp } = store || {};
  const port = 9100;
  const host = getItem('ipPrinterLabel') || printerIp;

  const options = { port, host };

  const handleSetUri = useCallback((uri: string, index: number) => {
    setResult((prev: any) => [...prev, { uri, index }]);
    setIsDone((d) => d + 1);
  }, []);

  const { mutate: genRongtaPrintData, data } = useGenRongtaPrintData();
  const printArrayData = data?.data || [];

  useEffect(() => {
    if (!host && !orderDetailProcessing) {
      setLoading(false);
      const id = setTimeout(() => {
        showAlert({
          message: `Chưa cài đặt máy in`,
          onConfirm: () => {
            hideAlert();
            router.back();
            router.navigate('/settings');
          },
          confirmText: 'Cài đặt ngay',
          isHideCancelButton: true,
        });
      }, 0);
      return () => clearTimeout(id);
    }
  }, [host, orderDetailProcessing]);

  useEffect(() => {
    if (!host) return;
    const id = setTimeout(() => {
      startTransition(() => {
        setLoading(
          true,
          connected ? 'Đang xử lý ...' : 'Đang kết nối máy in ...',
        );
      });
    }, 0);
    return () => clearTimeout(id);
  }, [host, connected]);

  useEffect(() => {
    if (result.length === 0) return;

    if (result.length === bagLabelsPrint.length && connected) {
      const resultsBase64Sorted = result
        .sort((a: any, b: any) => a.index - b.index)
        .map((item: any) => item.uri);

      genRongtaPrintData({ base64Images: resultsBase64Sorted });
    }
  }, [result, connected]);

  useEffect(() => {
    if (!host) return;

    let timer: any;
    let hasShownFailAlert = false;

    try {
      refClient.current = TcpSocket.createConnection(options, () => {
        clearTimeout(timer);
        startTransition(() => setConnected(true));
      });

      const showConnectionFailAlert = async () => {
        if (hasShownFailAlert) return;
        hasShownFailAlert = true;
        const ipHint = await getDeviceIpHintText();
        showAlert({
          message: (
            <View style={{ alignSelf: 'stretch' }}>
              <Text className="text-center text-sm">
                {`Không thể kết nối với máy in label tại IP: ${host}.`}
              </Text>
              <Text className="text-center text-sm mt-2 font-semibold text-orange-500">
                {ipHint}
              </Text>
            </View>
          ),
          onConfirm: () => {
            hideAlert();
            router.back();
          },
          confirmText: 'Trở lại',
          isHideCancelButton: true,
        });
      };

      refClient.current.on('error', () => {
        clearTimeout(timer);
        startTransition(() => {
          setLoading(false);
          setConnected(false);
        });
        void showConnectionFailAlert();
      });

      timer = setTimeout(() => {
        try {
          refClient.current?.destroy();
        } catch {}
        startTransition(() => {
          setLoading(false);
          setConnected(false);
        });
        void showConnectionFailAlert();
      }, TIMEOUT_CONNECT_PRINTER);
    } catch (err) {
      setConnected(false);
    }
  }, [host]);

  //----------------------------------------------------
  // ★★★★★ ONLY RUN ONCE WHEN CONNECTED + DATA READY ★★★★★
  //----------------------------------------------------
  useEffect(() => {
    if (!connected) return;
    if (!printArrayData.length) return;
    if (hasPrintedRef.current) return;

    hasPrintedRef.current = true;
    isCancelledRef.current = false;

    // Mark printed
    if (orderCode) {
      setOrderPrintedBagLabel({
        orderCode: orderCode,
        labelCodes: bagLabelsPrint.map((item) => item.code),
      });
    }

    async function printQueue() {
      for (let i = 0; i < printArrayData.length; i++) {
        if (isCancelledRef.current) return;

        const printData = new Uint8Array(printArrayData[i]);

        await new Promise((resolve) => {
          setTimeout(
            () => {
              if (!isCancelledRef.current && refClient.current) {
                try {
                  refClient.current.write(printData);
                } catch {}
              }
              resolve(true);
            },
            PRINT_DELAY * (i + 1),
          );
        });
      }

      if (isCancelledRef.current) return;
      setTimeout(async () => {
        if (!isCancelledRef.current && router.canGoBack()) {
          await queryClient.invalidateQueries({
            queryKey: ['orderDetail', orderCode],
          });
          router.back();
        }
      }, 400);
    }

    printQueue();
  }, [connected, printArrayData]); // <== CHỈ phụ thuộc connected, không phụ thuộc printArrayData

  // Cleanup không xóa timeout (rất quan trọng)
  useEffect(() => {
    return () => {
      setLoading(false);
      isCancelledRef.current = true;
      try {
        refClient.current?.destroy();
      } catch {}
      setResult([]);
      hasPrintedRef.current = false;
    };
  }, []);

  if (!orderCode) {
    return null;
  }

  return (
    <View style={{ padding: 10 }}>
      <ScrollView>
        <View className="gap-3">
          {bagLabelsPrint.slice(0, done + 1).map((item, index) => (
            <LabelPrintTemplate
              key={item.code ?? index}
              {...item}
              orderCode={orderCode}
              index={index}
              bagLabelsPrint={bagLabelsPrint}
              total={bagLabelsPrint.length}
              setUri={handleSetUri}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default PrintPreview;
