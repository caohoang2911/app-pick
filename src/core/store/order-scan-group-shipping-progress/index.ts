/**
 * Tiến độ scan túi theo nhóm gom shipping — chỉ dùng cho màn
 * `order-scan-to-delivery/[code].tsx`, không dùng cho store-start hay flow khác.
 */
import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';
import type { OrderDetailHeader } from '~/src/types/order-pick';

export function getGroupShippingProgressKey(
  header:
    | Pick<OrderDetailHeader, 'groupShippingCode' | 'groupShippingOrderCodes'>
    | undefined,
): string | null {
  const codes = header?.groupShippingOrderCodes;
  if (!codes?.length || codes.length < 2) return null;
  if (header?.groupShippingCode) return header.groupShippingCode;
  return [...codes].sort().join('|');
}

export function getFirstIncompleteOrderCode(
  orderedCodes: string[],
  scannedByCode: Record<string, boolean>,
): string | undefined {
  return orderedCodes.find((c) => !scannedByCode[c]);
}

export function isGroupShippingBagsComplete(
  orderedCodes: string[],
  scannedByCode: Record<string, boolean>,
): boolean {
  return orderedCodes.every((c) => scannedByCode[c] === true);
}

interface OrderScanGroupShippingProgressState {
  activeGroupKey: string | null;
  scannedByCode: Record<string, boolean>;
  ensureGroup: (groupKey: string, orderCodes: string[]) => void;
  markOrderBagsScannedComplete: (orderCode: string) => void;
  reset: () => void;
}

const _useOrderScanGroupShippingProgress =
  create<OrderScanGroupShippingProgressState>((set) => ({
    activeGroupKey: null,
    scannedByCode: {},
    ensureGroup: (groupKey, orderCodes) => {
      set((state) => {
        if (state.activeGroupKey !== groupKey) {
          const scannedByCode: Record<string, boolean> = {};
          for (const c of orderCodes) {
            scannedByCode[c] = false;
          }
          return { activeGroupKey: groupKey, scannedByCode };
        }
        const scannedByCode = { ...state.scannedByCode };
        for (const c of orderCodes) {
          if (!(c in scannedByCode)) {
            scannedByCode[c] = false;
          }
        }
        return { scannedByCode };
      });
    },
    markOrderBagsScannedComplete: (orderCode) => {
      set((s) => ({
        scannedByCode: { ...s.scannedByCode, [orderCode]: true },
      }));
    },
    reset: () => set({ activeGroupKey: null, scannedByCode: {} }),
  }));

export const useOrderScanGroupShippingProgress = createSelectors(
  _useOrderScanGroupShippingProgress,
);

export const resetOrderScanGroupShippingProgress = () => {
  _useOrderScanGroupShippingProgress.getState().reset();
};

export const ensureOrderScanGroupShipping = (
  groupKey: string,
  orderCodes: string[],
) => {
  _useOrderScanGroupShippingProgress
    .getState()
    .ensureGroup(groupKey, orderCodes);
};

export const markOrderScanGroupOrderBagsComplete = (orderCode: string) => {
  _useOrderScanGroupShippingProgress
    .getState()
    .markOrderBagsScannedComplete(orderCode);
};
