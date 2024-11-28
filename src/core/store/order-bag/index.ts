import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderBagItem, OrderBagType } from '~/src/types/order-bag';
import { OrderDetail } from '~/src/types/order-detail';
import { transformBagsData } from '~/src/core/utils/order-bag';

interface OrderBagState {
  orderDetail: OrderDetail;
  orderBags: {
    DRY: Array<any>;
    FROZEN: Array<any>;
    FRESH: Array<any>;
    NON_FOOD: Array<any>;
  };
  header?: any;
  isLoadingDeliveryOrderDetail: boolean;
  setOrderBags: (values: OrderBagItem) => void;
  setOrderDetail: (orderDetail: OrderDetail) => void;
  addOrderBag: (values: OrderBagItem) => void;
  removeOrderBag: (code: string, type: OrderBagType) => void;
}

const _useOrderBag = create<OrderBagState>((set, get) => ({
  orderDetail: {},
  orderBags: {
    DRY: [],
    FROZEN: [],
    FRESH: [],
    NON_FOOD: [],
  },
  isLoadingDeliveryOrderDetail: false,
  setOrderDetail: (orderDetail: OrderDetail) => {
    set({ orderDetail, orderBags: transformBagsData(orderDetail?.header?.bagLabels) });
  },
  setOrderBags: (values: any) => {
    set({ orderBags: values });
  },
  addOrderBag: (values: OrderBagItem) => {
    set({ orderBags: { ...get().orderBags, [values.type]: [...get().orderBags[values.type], values] } });
  },
  removeOrderBag: (code: string, type: OrderBagType) => {
    set({ orderBags: { ...get().orderBags, [type]: get().orderBags[type].filter((item: OrderBagItem) => item.code !== code) } });
  },
}));

export const useOrderBag = createSelectors(_useOrderBag);

export const setOrderBags = (values: OrderBagItem) => {
  useOrderBag.getState().setOrderBags(values);
};

export const setOrderDetail = (orderDetail: OrderDetail) => {
  useOrderBag.getState().setOrderDetail(orderDetail);
};

export const addOrderBag = (values: OrderBagItem) => {
  useOrderBag.getState().addOrderBag(values);
};

export const removeOrderBag = (code: string, type: OrderBagType) => {
  useOrderBag.getState().removeOrderBag(code, type);
};
