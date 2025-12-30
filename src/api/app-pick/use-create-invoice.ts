import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import TcpSocket from 'react-native-tcp-socket';
import { Env } from '~/env';
import { useAuth } from '~/src/core';
import { getItem } from '~/src/core/storage';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { useGenXPrinterPrintData } from './use-gen-x-printer-print-data';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & AxiosResponse;

const TIMEOUT_CONNECT_PRINTER = 5000;
const PRINTER_PORT = 9100;
const BASE64_REGEX = /^(data:image\/[a-zA-Z]+;base64,)?[A-Za-z0-9+/=]+$/;
const INVOICE_API_URL = Env.INVOICE_API_URL;

const getPrinterHost = (): string | null => {
  const config = useConfig.getState().config;
  const user = useAuth.getState().userInfo;
  const { storeCode } = user || {};
  const stores = config?.stores || [];
  const store: any = stores.find((store: any) => store.id === storeCode);
  const { billPrinterIp } = store || {};
  return getItem<string>('ipPrinterBill') || billPrinterIp || '';
};

const cleanupConnection = (client: any, timer: NodeJS.Timeout | null) => {
  if (timer) {
    clearTimeout(timer);
  }
  if (client) {
    client.destroy();
  }
};

const checkPrinterConnection = (): Promise<TcpSocket.Socket> => {
  return new Promise((resolve, reject) => {
    const host = getPrinterHost();

    if (!host) {
      showMessage({
        message:
          'Chưa cài đặt máy in. Vui lòng cài đặt máy in trước khi xuất hóa đơn.',
        type: 'danger',
      });
      reject(new Error('Printer not configured'));
      return;
    }

    const options: any = {
      port: PRINTER_PORT,
      host: host,
    };

    let client: any;
    let timer: NodeJS.Timeout | null = null;

    try {
      client = TcpSocket.createConnection(options, () => {
        cleanupConnection(null, timer);
        resolve(client);
      });

      timer = setTimeout(() => {
        cleanupConnection(client, timer);
        showMessage({
          message: `Không thể kết nối với máy tạo hoá đơn tại IP: ${host}. Vui lòng kiểm tra lại.`,
          type: 'danger',
        });
        reject(new Error('Printer connection timeout'));
      }, TIMEOUT_CONNECT_PRINTER);

      client.on('error', (error: any) => {
        cleanupConnection(client, timer);
        showMessage({
          message: `Không thể kết nối với máy tạo hoá đơn tại IP: ${host}. Vui lòng kiểm tra lại.`,
          type: 'danger',
        });
        reject(error);
      });
    } catch (error) {
      cleanupConnection(client, timer);
      showMessage({
        message: 'Lỗi khi kết nối máy in. Vui lòng thử lại.',
        type: 'danger',
      });
      reject(error);
    }
  });
};

const fetchBase64ImageByInvoiceURL = async (
  orderCode: string,
): Promise<{ data: string }> => {
  return await axios.get(`${INVOICE_API_URL}?orderCode=${orderCode}`);
};

const useFetchBase64ImageByInvoiceURL = (
  cb?: (base64Image: string) => void,
) => {
  return useMutation({
    mutationFn: (orderCode: string): Promise<{ data: string }> =>
      fetchBase64ImageByInvoiceURL(orderCode),
    onSuccess: (data: { data: string }) => {
      if (data) {
        cb?.(data.data);
      } else {
        setLoading(false);
        showMessage({
          message: 'không thể tải dữ liệu hóa đơn',
          type: 'danger',
        });
      }
    },
  });
};

const createInvoice = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/createInvoice', params);
};

export const useCreateInvoice = () => {
  return useMutation({
    mutationFn: (params: Variables) => createInvoice(params),
  });
};

const validateBase64Image = (base64Image: string): string => {
  const trimmedBase64 = base64Image.trim();

  if (!BASE64_REGEX.test(trimmedBase64)) {
    setLoading(false);
    showMessage({
      message: 'Định dạng dữ liệu hóa đơn không hợp lệ',
      type: 'danger',
    });
    throw new Error('Invalid base64 format');
  }

  return trimmedBase64;
};

const sendToPrinter = async (
  client: TcpSocket.Socket,
  printerBuffer: Uint8Array,
) => {
  client.write(printerBuffer);
  await new Promise((resolve) => setTimeout(resolve, 100));
};
export const useCreateInvoiceProcess = (orderCode: string, cb?: () => void) => {
  const { mutateAsync: genXPrinterPrintDataAsync } = useGenXPrinterPrintData();
  const { mutateAsync: fetchBase64ImageByInvoiceURLAsync } =
    useFetchBase64ImageByInvoiceURL();

  return useMutation({
    mutationFn: async (params: {
      orderCode: string;
      codReceiptBase64String?: string;
    }): Promise<any> => {
      setLoading(true);
      let client: TcpSocket.Socket | null = null;
      try {
        client = await checkPrinterConnection();

        const base64Image = await fetchBase64ImageByInvoiceURLAsync(orderCode);
        const fullBase64 = validateBase64Image(base64Image.data);

        const {
          data: printerBuffers,
          error,
          hasError,
        } = await genXPrinterPrintDataAsync({
          base64Image: fullBase64,
        });

        if (hasError && error) {
          setLoading(false);
          showMessage({
            message: error,
            type: 'danger',
          });
          throw new Error('Generate printer buffer error');
        }

        if (!error && printerBuffers?.length > 0 && client) {
          // Gửi tuần tự từng buffer, đợi mỗi lần gửi xong mới gửi tiếp
          for (const printerBuffer of printerBuffers) {
            await sendToPrinter(client, printerBuffer as unknown as Uint8Array);
          }

          if (params.codReceiptBase64String) {
            const {
              data: codReceiptPrinterBuffers,
              error,
              hasError,
            } = await genXPrinterPrintDataAsync({
              base64Image: params.codReceiptBase64String,
            });

            if (hasError && error) {
              setLoading(false);
              showMessage({
                message: error,
                type: 'danger',
              });
              throw new Error('Generate printer cod receipt error');
            }

            if (!error && codReceiptPrinterBuffers?.length > 0 && client) {
              for (const codReceiptPrinterBuffer of codReceiptPrinterBuffers) {
                await sendToPrinter(
                  client,
                  codReceiptPrinterBuffer as unknown as Uint8Array,
                );
              }
            }
          }

          // Tất cả sendToPrinter đã hoàn thành, mới destroy client
          if (client) {
            client.destroy();
            client = null;
          }
        } else {
          if (client) {
            client.destroy();
            client = null;
          }
          showMessage({
            message: error?.toString() || 'Không thể in hóa đơn',
            type: 'danger',
          });
          throw new Error('Printer buffer is empty');
        }

        return { error: null, data: null };
      } catch (error) {
        // Cleanup client nếu có lỗi
        if (client) {
          client.destroy();
          client = null;
        }
        setLoading(false);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      setLoading(false);
      if (!data?.error) {
        cb?.();
      }
    },
    onError: () => {
      setLoading(false);
    },
  });
};
