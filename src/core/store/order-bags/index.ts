import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import { OrderBagItem, OrderBagType } from '~/src/types/order-bags';
import { OrderDetail } from '~/src/types/order-pick';
import { generateBagName } from '~/src/core/utils/order-bags';

interface OrderBagState {
  orderDetail: OrderDetail;
  hasUpdateOrderBagLabels: boolean;
  orderBags: {
    DRY: Array<any>;
    FROZEN: Array<any>;
    FRESH: Array<any>;
  };
  previousOrderBags?: {
    DRY: Array<any>;
    FROZEN: Array<any>;
    FRESH: Array<any>;
  };
  header?: any;
  isLoadingDeliveryOrderDetail: boolean;
  setOrderBags: (values: OrderBagItem) => void;
  setHasUpdateOrderBagLabels: (hasUpdateOrderBagLabels: boolean) => void;
  addOrderBag: (values: OrderBagItem) => void;
  removeOrderBag: (code: string, type: OrderBagType) => void;
  undoLastChange: () => void;
}

const _useOrderBags = create<OrderBagState>((set, get) => ({
  orderDetail: {},
  hasUpdateOrderBagLabels: false,
  orderBags: {
    DRY: [],
    FROZEN: [],
    FRESH: [],
  },
  isLoadingDeliveryOrderDetail: false,
  setHasUpdateOrderBagLabels: (hasUpdateOrderBagLabels: boolean) => {
    set({ hasUpdateOrderBagLabels });
  },
  setOrderBags: (values: any) => {
    set({ orderBags: values });
  },
  addOrderBag: (values: OrderBagItem) => {
    // Save previous state before making changes
    const currentState = get().orderBags;
    set({
      hasUpdateOrderBagLabels: true,
      previousOrderBags: currentState,
      orderBags: {
        ...get().orderBags,
        [values.type]: [...get().orderBags[values.type], { ...values }],
      },
    });
  },
  removeOrderBag: (code: string, type: OrderBagType) => {
    // Save previous state before making changes
    const currentState = get().orderBags;
    set({
      hasUpdateOrderBagLabels: true,
      previousOrderBags: currentState,
      orderBags: {
        ...get().orderBags,
        [type]: get()
          .orderBags[type].filter((item: OrderBagItem) => item.code !== code)
          .map((item: OrderBagItem, index: number) => ({
            ...item,
            name: generateBagName(type, index + 1),
          })),
      },
    });
  },
  undoLastChange: () => {
    const previousState = get().previousOrderBags;
    if (previousState) {
      set({
        orderBags: previousState,
        hasUpdateOrderBagLabels: false,
        previousOrderBags: undefined,
      });
    }
  },
}));

export const useOrderBags = createSelectors(_useOrderBags);

export const setOrderBags = (values: OrderBagItem) => {
  useOrderBags.getState().setOrderBags(values);
};

export const addOrderBag = (values: OrderBagItem) => {
  useOrderBags.getState().addOrderBag(values);
};

export const removeOrderBag = (code: string, type: OrderBagType) => {
  useOrderBags.getState().removeOrderBag(code, type);
};

export const undoLastChange = () => {
  useOrderBags.getState().undoLastChange();
};

export const setHasUpdateOrderBagLabels = (
  hasUpdateOrderBagLabels: boolean,
) => {
  useOrderBags.getState().setHasUpdateOrderBagLabels(hasUpdateOrderBagLabels);
};
