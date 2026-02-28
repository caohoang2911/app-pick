import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import TcpSocket from 'react-native-tcp-socket';
import { Env } from '~/env';
import { getPrinterHost } from '~/src/core/utils/printer';
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

export type UseCreateInvoiceFlowOptions = {
  /** Gọi khi tạo hóa đơn thành công (vd: gọi in nếu không COD) */
  onSuccess?: (orderCode: string) => void;
};

/** Flow tạo hóa đơn: gọi API createInvoice, show lỗi nếu fail, gọi onSuccess(orderCode) nếu thành công. */
export const useCreateInvoiceFlow = (options?: UseCreateInvoiceFlowOptions) => {
  return useMutation({
    mutationFn: async (params: Variables): Promise<Response> => {
      const result = await createInvoice(params);
      if (result?.error) {
        showMessage({
          message: result.error,
          type: 'danger',
        });
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (_data, variables) => {
      options?.onSuccess?.(variables.orderCode);
    },
    onError: () => {
      setLoading(false);
    },
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

export type UseCreateInvoiceProcessOptions = {
  onSuccess?: () => void;
  successMessage?: string;
};

export const useCreateInvoiceProcess = (
  options?: UseCreateInvoiceProcessOptions,
) => {
  const { onSuccess, successMessage } = options ?? {};
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

        const base64Image = await fetchBase64ImageByInvoiceURLAsync(
          params.orderCode,
        );
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

          if (client) {
            client.destroy();
            client = null;
          }

          if (successMessage) {
            showMessage({
              message: successMessage,
              type: 'success',
            });
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
      if (data && !data.error) {
        onSuccess?.();
      }
    },
    onError: () => {
      setLoading(false);
    },
  });
};
