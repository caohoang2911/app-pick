export enum OrderBagType {
  DRY = 'DRY',
  FROZEN = 'FROZEN',
  FRESH = 'FRESH',
}

export enum OrderBagCode {
  DRY = 'DR',
  FROZEN = 'FZ',
  FRESH = 'FR',
}

export enum OrderBagLabel {
  DRY = 'Hàng khô',
  FROZEN = 'Hàng đông lạnh',
  FRESH = 'Hàng tươi mát',
}

export type OrderBagItem = {
  code: string;
  type: OrderBagType;
  name: string;
  isDone?: boolean;
}

export type OrderBag = {
  DRY: Array<any>;
  FROZEN: Array<any>;
  FRESH: Array<any>;
}