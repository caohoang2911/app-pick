/**
 * Kiểu dữ liệu cho hệ thống quản lý quyền (App Permission Status).
 * Trạng thái được chuẩn hoá về 1 tập chung cho mọi cơ chế bên dưới
 * (vision-camera, expo-notifications, PermissionsAndroid, CallKeep...).
 */

export type PermissionStatus =
  /** Đã cấp quyền. */
  | 'granted'
  /** Từ chối nhưng vẫn hỏi lại được (có thể request tiếp). */
  | 'denied'
  /** Từ chối vĩnh viễn / "Không hỏi lại" → phải mở Cài đặt hệ thống. */
  | 'blocked'
  /** Chưa từng hỏi. */
  | 'undetermined'
  /** iOS: quyền ảnh giới hạn. */
  | 'limited'
  /** Không áp dụng trên nền tảng này hoặc không kiểm tra được bằng code. */
  | 'unavailable';

export type PermissionCategory = 'required' | 'optional';

export type AppPermissionId =
  'notifications' | 'camera' | 'microphone' | 'phoneAccount' | 'photoLibrary';

export type PermissionPlatform = 'ios' | 'android';

export interface AppPermissionDescriptor {
  id: AppPermissionId;
  /** Tên hiển thị (VN). */
  title: string;
  /** Vì sao app cần quyền này (VN). */
  description: string;
  /** Tên icon Ionicons. */
  icon: string;
  category: PermissionCategory;
  /** Nền tảng mà quyền này áp dụng & theo dõi được trạng thái. */
  platforms: PermissionPlatform[];
  /**
   * Quyền chỉ bật/tắt được trong Cài đặt hệ thống (không có hộp thoại request),
   * ví dụ "Tài khoản gọi" của CallKeep trên Android.
   */
  settingsOnly?: boolean;
  /** Kiểm tra trạng thái hiện tại. */
  check: () => Promise<PermissionStatus>;
  /** Xin quyền (mở dialog hệ thống hoặc mở Cài đặt nếu settingsOnly). */
  request: () => Promise<PermissionStatus>;
  /** Mở đúng màn Cài đặt cho quyền này (mặc định: Cài đặt app). */
  openSettings?: () => void;
}

export interface PermissionState {
  status: PermissionStatus;
  /** Mốc thời gian (ms) lần kiểm tra gần nhất. */
  checkedAt: number;
}

export type PermissionStateMap = Partial<
  Record<AppPermissionId, PermissionState>
>;

/** Một dòng trong bảng liệt kê quyền khai báo ở native (chỉ để hiển thị). */
export interface DeclaredPermissionInfo {
  /** Tên quyền native / key Info.plist. */
  name: string;
  /** Mục đích sử dụng (VN). */
  purpose: string;
  /** true = xin lúc chạy (runtime), false = cấp lúc cài / chỉ khai báo. */
  runtime?: boolean;
}
