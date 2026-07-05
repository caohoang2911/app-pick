import { EmployeeRole, Role } from '~/src/types/employee';

/** Tên gọi đại diện — lấy từ cuối chuỗi họ tên (vd. "Võ Thị Anh Thy" → "Thy"). */
export const getRepresentativeFirstName = (fullName?: string) => {
  const trimmed = fullName?.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] ?? trimmed;
};

const PICKER_SHIFT_MANAGEMENT_ROLES: EmployeeRole[] = [
  EmployeeRole.STORE_MANAGER,
  EmployeeRole.STORE_SHIFT_SUPERVISOR,
  EmployeeRole.ADMIN,
];

/** Quản lý ca FT-Picker — tạm ẩn với NV Siêu Thị (`STORE`). */
export const canManagePickerShift = (role?: string): boolean => {
  return true;
};
