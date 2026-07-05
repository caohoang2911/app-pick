import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getApplicablePermissions } from '@/core/services/permissions';
import type {
  AppPermissionId,
  PermissionStateMap,
  PermissionStatus,
} from '@/types/permissions';

/**
 * Theo dõi trạng thái toàn bộ quyền áp dụng cho nền tảng hiện tại.
 * - Kiểm tra lúc mount và mỗi khi app quay lại foreground (user vừa từ màn
 *   Cài đặt hệ thống trở lại → cập nhật ngay).
 * - Cung cấp `request(id)` để xin từng quyền và `refresh()` để kiểm tra lại.
 */
export function usePermissions() {
  // Danh sách quyền cố định theo nền tảng — tính 1 lần.
  const descriptors = useMemo(() => getApplicablePermissions(), []);

  const [states, setStates] = useState<PermissionStateMap>({});
  const [isChecking, setIsChecking] = useState(true);

  // Tránh setState sau khi unmount (các check là async).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsChecking(true);
    const now = Date.now();
    const results = await Promise.all(
      descriptors.map(async (d) => {
        let status: PermissionStatus;
        try {
          status = await d.check();
        } catch (err) {
          console.warn(`[usePermissions] check ${d.id} failed`, err);
          status = 'unavailable';
        }
        return [d.id, { status, checkedAt: now }] as const;
      }),
    );
    if (!mountedRef.current) return;
    setStates(Object.fromEntries(results) as PermissionStateMap);
    setIsChecking(false);
  }, [descriptors]);

  const request = useCallback(
    async (id: AppPermissionId): Promise<PermissionStatus | undefined> => {
      const descriptor = descriptors.find((d) => d.id === id);
      if (!descriptor) return undefined;
      let status: PermissionStatus;
      try {
        status = await descriptor.request();
      } catch (err) {
        console.warn(`[usePermissions] request ${id} failed`, err);
        return undefined;
      }
      if (mountedRef.current) {
        setStates((prev) => ({
          ...prev,
          [id]: { status, checkedAt: Date.now() },
        }));
      }
      return status;
    },
    [descriptors],
  );

  // Kiểm tra lần đầu.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Kiểm tra lại khi app trở lại foreground (round-trip từ Cài đặt hệ thống).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { descriptors, states, isChecking, refresh, request };
}
