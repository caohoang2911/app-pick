import { EmployeeRole, Role } from '~/src/types/employee';

/** Tên gọi đại diện — lấy từ cuối chuỗi họ tên (vd. "Võ Thị Anh Thy" → "Thy"). */
export const getRepresentativeFirstName = (fullName?: string) => {
  const trimmed = fullName?.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] ?? trimmed;
};

const PICKER_SHIFT_MANAGEMENT_ROLES: EmployeeRole[] = [
  EmployeeRole.ADMIN,
  EmployeeRole.STORE,
  EmployeeRole.STORE_MANAGER,
  EmployeeRole.STORE_SHIFT_SUPERVISOR,
];

/** Quản lý ca Picker — ADMIN, STORE, STORE_MANAGER, STORE_SHIFT_SUPERVISOR. */
export const canManagePickerShift = (role?: string): boolean => {
  if (!role) return false;
  return (PICKER_SHIFT_MANAGEMENT_ROLES as string[]).includes(role);
};

const STORE_EMPLOYEE_MANAGEMENT_ROLES: EmployeeRole[] = [
  EmployeeRole.ADMIN,
  EmployeeRole.STORE_MANAGER,
  EmployeeRole.STORE_SHIFT_SUPERVISOR,
];

/** Quản lý nhân viên siêu thị — chỉ ADMIN, STORE_MANAGER, STORE_SHIFT_SUPERVISOR (loại STORE). */
export const canManageStoreEmployees = (role?: string): boolean => {
  if (!role) return false;
  return (STORE_EMPLOYEE_MANAGEMENT_ROLES as string[]).includes(role);
};
