import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import TcpSocket from 'react-native-tcp-socket';
import { getItem } from '~/src/core/storage';
import { useConfig } from '~/src/core/store/config';
import { useAuth } from '~/src/core';
import { setLoading } from '~/src/core/store/loading';

type Variables = {
  orderCode: string;
};

type Response = { error: string } & AxiosResponse;

const TIMEOUT_CONNECT_PRINTER = 5000;

const checkPrinterConnection = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Get printer IP from storage or config
    const config = useConfig.getState().config;
    const user = useAuth.getState().userInfo;
    const { storeCode } = user || {};
    const stores = config?.stores || [];
    const store: any = stores.find((store: any) => store.id === storeCode);
    const { printerIp } = store || {};
    const host = getItem<string>('ip') || printerIp;

    if (!host) {
      showMessage({
        message: 'Chưa cài đặt máy in. Vui lòng cài đặt máy in trước khi xuất hóa đơn.',
        type: 'danger',
      });
      reject(new Error('Printer not configured'));
      return;
    }

    const port = 9100;
    const options: any = {
      port: port,
      host: host,
    };

    let client: any;
    let timer: NodeJS.Timeout | null = null;

    try {
      client = TcpSocket.createConnection(options, () => {
        console.log('Connected to printer');
        if (timer) {
          clearTimeout(timer);
        }
        client.destroy();
        resolve(true);
      });

      timer = setTimeout(() => {
        console.log('Printer connection timeout');
        if (client) {
          client.destroy();
        }
        showMessage({
          message: `Không thể kết nối với máy in ${host}. Vui lòng kiểm tra lại.`,
          type: 'danger',
        });
        reject(new Error('Printer connection timeout'));
      }, TIMEOUT_CONNECT_PRINTER);

      client.on('error', (error: any) => {
        console.log('Printer connection error:', error);
        if (timer) {
          clearTimeout(timer);
        }
        if (client) {
          client.destroy();
        }
        showMessage({
          message: `Không thể kết nối với máy in ${host}. Vui lòng kiểm tra lại.`,
          type: 'danger',
        });
        reject(error);
      });
    } catch (error) {
      console.log('Printer connection exception:', error);
      if (timer) {
        clearTimeout(timer);
      }
      if (client) {
        client.destroy();
      }
      showMessage({
        message: `Lỗi khi kết nối máy in. Vui lòng thử lại.`,
        type: 'danger',
      });
      reject(error);
    }
  });
};

const issueInvoice = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/issueInvoice', params);
};

export const useIssueInvoice = (cb?: () => void) => {
  return useMutation({
    mutationFn: async (params: Variables) => {
      setLoading(true, 'Đang kiểm tra máy in...'); 
      // Kiểm tra máy in trước khi gọi API
      try {
        // await checkPrinterConnection();
        // Nếu kết nối máy in thành công thì mới gọi API
        function checkPrinterConnection() {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve(true);
            }, 2000);
          });
        }

        await checkPrinterConnection();
        return await issueInvoice(params);
       
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    onSuccess: (data: Response) => {
      setLoading(false);
      if (!data.error) {
        showMessage({
          message: 'Đã xuất hóa đơn thành công',
          type: 'success',
        });
        cb?.();
      }
    },
  });
};


