import { create } from 'zustand';

import { createSelectors } from '../../utils/browser';
import { Config } from '~/src/types/config';
import { getConfigLocalStore, getVersionLocalStore, setConfigLocalStore, setVersionLocalStore } from './utils';
import { ConfigResponse } from '~/src/api/config/useGetConfig';


interface ConfigState {
  config: Config;
  version: string;
  setConfig: (config: ConfigResponse) => void;
  hydrateConfig: () => void;
}

const _useConfig = create<ConfigState>((set, get) => ({
  config: {
    productPickedErrors: [],
    orderStatuses: [],
    paymentMethods: [],
    sourceSales: [],
    wards: [],
    districts: [],
    cities: [],
    shippingMethods: [],
    stores: [],
    orderTags: [],
    orderOperationTypes: [],
  },
  version: '',
  setConfig: (config: ConfigResponse) => {
    const { allConfig, version } = config || {};
    setConfigLocalStore(config?.allConfig as unknown as string);
    setVersionLocalStore(version as unknown as string);
    set({ config: allConfig });
    set({ version: version });
  },
  hydrateConfig: () => {
    try {
      const config = getConfigLocalStore();
      const version = getVersionLocalStore();

      if (config) {
        set({ config: config as unknown as Config });
      }

      if(version){
        set({ version });
      }

    } catch (error) {
      
    }
  },
}));

export const useConfig = createSelectors(_useConfig);

export const setConfig = (config: ConfigResponse) => _useConfig.getState().setConfig(config);
export const hydrateConfig = () => _useConfig.getState().hydrateConfig();


