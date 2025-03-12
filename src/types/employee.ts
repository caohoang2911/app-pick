type Role = 'ADMIN' | 'STORE';

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