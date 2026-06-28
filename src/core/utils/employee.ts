import { EmployeeRole } from '~/src/types/employee';

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
];

// export const canManagePickerShift = (role?: string) =>
//   !!role && PICKER_SHIFT_MANAGEMENT_ROLES.includes(role as EmployeeRole);

export const canManagePickerShift = (role?: string) => true;
