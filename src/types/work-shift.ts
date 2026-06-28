export type WorkShiftEmployee = {
  id: number;
  name: string;
  username: string;
};

export type WorkShiftUpdatedBy = {
  id: number;
  name: string;
  username: string;
};

export type WorkShift = {
  id: number;
  startTime: number;
  endTime: number;
  storeCode: string;
  employee: WorkShiftEmployee;
  updatedBy?: WorkShiftUpdatedBy;
};

export type SaveWorkShiftPayload = {
  id?: number;
  startTime: number;
  endTime: number;
  employee: Pick<WorkShiftEmployee, 'id' | 'name'>;
};
