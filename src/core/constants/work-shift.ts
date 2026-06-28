import { EmployeeRole } from '~/src/types/employee';

export type WorkShiftPreset = {
  id: string;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
};

export const WORK_SHIFT_PRESETS: WorkShiftPreset[] = [
  {
    id: 'morning',
    label: 'Ca sáng 07:00 - 11:00',
    startHour: 7,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
    color: '#3280F6',
  },
  {
    id: 'afternoon',
    label: 'Ca chiều 14:00 - 18:00',
    startHour: 14,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    color: '#6B46C1',
  },
];

export const WORK_SHIFT_EMPLOYEE_ROLES: EmployeeRole[] = [
  EmployeeRole.STORE,
  EmployeeRole.STORE_MANAGER,
  EmployeeRole.STORE_SHIFT_SUPERVISOR,
];
