import { getItem } from '~/src/core/storage';
import { useAuth } from '~/src/core';
import { useConfig } from '~/src/core/store/config';

export const getPrinterHost = (): string | null => {
  const config = useConfig.getState().config;
  const user = useAuth.getState().userInfo;
  const { storeCode } = user || {};
  const stores = config?.stores || [];
  const store: any = stores.find((store: any) => store.id === storeCode);
  const { billPrinterIp } = store || {};
  return getItem<string>('ipPrinterBill') || billPrinterIp || '';
};
