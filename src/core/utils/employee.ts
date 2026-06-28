/** Tên gọi đại diện — lấy từ cuối chuỗi họ tên (vd. "Võ Thị Anh Thy" → "Thy"). */
export const getRepresentativeFirstName = (fullName?: string) => {
  const trimmed = fullName?.trim();
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  return parts[parts.length - 1] ?? trimmed;
};
