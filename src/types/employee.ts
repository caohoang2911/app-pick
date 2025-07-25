export enum Role {
  ADMIN = 'ADMIN',
  STORE = 'STORE',
  STORE_MANAGER = 'STORE_MANAGER',
  INTERNAL_SHIPPER = 'INTERNAL_SHIPPER'
}


export type Employee = {
  employeeId?: string;
  createdTime: number;
  email: string;
  id: number;
  name: string;
  phone: string;
  username: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  membership: {
    rank: string;
    rankName: string;
  };
  numberOrders: number;
  spend: number;
  points: number;
};
