import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PermissionRow from '@/components/permissions/permission-row';
import { usePermissions } from '@/core/hooks/usePermissions';
import {
  DECLARED_PERMISSIONS_AUDIT,
  openAppSettings,
} from '@/core/services/permissions';
import type {
  AppPermissionDescriptor,
  PermissionStatus,
} from '@/types/permissions';

const openFor = (d: AppPermissionDescriptor) =>
  (d.openSettings ?? openAppSettings)();

const PermissionsScreen = () => {
  const insets = useSafeAreaInsets();
  const { descriptors, states, isChecking, refresh, request } =
    usePermissions();
  const [showAudit, setShowAudit] = useState(false);

  const statusOf = (id: AppPermissionDescriptor['id']): PermissionStatus =>
    states[id]?.status ?? 'undetermined';

  const { total, grantedCount, requiredMissing } = useMemo(() => {
    const granted = descriptors.filter(
      (d) => statusOf(d.id) === 'granted',
    ).length;
    const reqMissing = descriptors.filter(
      (d) => d.category === 'required' && statusOf(d.id) !== 'granted',
    ).length;
    return {
      total: descriptors.length,
      grantedCount: granted,
      requiredMissing: reqMissing,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptors, states]);

  const allGranted = requiredMissing === 0;
  const progress = total > 0 ? grantedCount / total : 0;

  const requiredList = descriptors.filter((d) => d.category === 'required');
  const optionalList = descriptors.filter((d) => d.category === 'optional');

  const handleToggle = async (
    d: AppPermissionDescriptor,
    status: PermissionStatus,
  ) => {
    // Đã quyết định rồi (đã cấp / bị chặn / giới hạn) hoặc quyền chỉ chỉnh được
    // trong Cài đặt (Tài khoản gọi) → mở THẲNG trang cài đặt chi tiết của app để
    // bật/tắt tại đó (không thể bật/tắt các quyền này ngay trong app).
    if (
      d.settingsOnly ||
      status === 'granted' ||
      status === 'blocked' ||
      status === 'limited'
    ) {
      openFor(d);
      return;
    }

    // Chưa hỏi / còn hỏi lại được (undetermined / denied) → hộp thoại xin quyền
    // của hệ thống (cách duy nhất cấp lần đầu — lúc này Settings chưa có toggle).
    // Nếu bị từ chối hẳn thì mở luôn trang cài đặt.
    const next = await request(d.id);
    if (next === 'blocked') {
      openFor(d);
    }
  };

  const auditRows =
    Platform.OS === 'ios'
      ? DECLARED_PERMISSIONS_AUDIT.ios
      : DECLARED_PERMISSIONS_AUDIT.android;

  return (
    <ScrollView
      className="flex-1 bg-gray-100"
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Thẻ tổng quan */}
      <View className="bg-white mx-4 mt-4 p-4 rounded-xl" style={styles.box}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2 flex-1">
            <View
              className={`w-10 h-10 rounded-full items-center justify-center ${
                allGranted ? 'bg-green-50' : 'bg-amber-50'
              }`}
            >
              <Ionicons
                name={allGranted ? 'shield-checkmark' : 'shield-half'}
                size={22}
                color={allGranted ? '#16a34a' : '#d97706'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900">
                {allGranted
                  ? 'Đã cấp đủ quyền cần thiết'
                  : `Thiếu ${requiredMissing} quyền cần thiết`}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                Đã cấp {grantedCount}/{total} quyền
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => void refresh()}
            hitSlop={8}
            className="flex-row items-center gap-1 px-2 py-1"
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Ionicons name="refresh" size={18} color="#3b82f6" />
            )}
            <Text className="text-xs font-medium text-blue-600">Kiểm tra</Text>
          </Pressable>
        </View>

        {/* Thanh tiến độ */}
        <View className="h-2 rounded-full bg-gray-100 mt-3 overflow-hidden">
          <View
            className={allGranted ? 'h-2 bg-green-500' : 'h-2 bg-amber-500'}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      </View>

      {/* Quyền cần thiết */}
      {requiredList.length > 0 && (
        <Section title="Quyền cần thiết">
          {requiredList.map((d, i) => (
            <RowWrapper key={d.id} isLast={i === requiredList.length - 1}>
              <PermissionRow
                descriptor={d}
                status={statusOf(d.id)}
                onToggle={handleToggle}
              />
            </RowWrapper>
          ))}
        </Section>
      )}

      {/* Quyền tùy chọn */}
      {optionalList.length > 0 && (
        <Section title="Quyền tùy chọn">
          {optionalList.map((d, i) => (
            <RowWrapper key={d.id} isLast={i === optionalList.length - 1}>
              <PermissionRow
                descriptor={d}
                status={statusOf(d.id)}
                onToggle={handleToggle}
              />
            </RowWrapper>
          ))}
        </Section>
      )}

      {/* Ghi chú */}
      <Text className="text-xs text-gray-400 px-6 mt-3 leading-4">
        Bật một quyền sẽ hiện hộp thoại xin quyền của hệ thống. Nếu quyền đang
        bật, bạn cần vào Cài đặt hệ thống để tắt.
      </Text>

      {/* Danh sách đầy đủ quyền khai báo (audit) */}
      <View className="bg-white mx-4 mt-4 rounded-xl" style={styles.box}>
        <Pressable
          onPress={() => setShowAudit((s) => !s)}
          className="flex-row items-center justify-between p-4"
        >
          <View className="flex-row items-center gap-2">
            <MaterialIcons name="list-alt" size={20} color="#6b7280" />
            <Text className="text-base font-semibold text-gray-800">
              Tất cả quyền khai báo ({Platform.OS === 'ios' ? 'iOS' : 'Android'}
              )
            </Text>
          </View>
          <Ionicons
            name={showAudit ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#6b7280"
          />
        </Pressable>
        {showAudit && (
          <View className="px-4 pb-3">
            {auditRows.map((row) => (
              <View
                key={row.name}
                className="flex-row items-start gap-2 py-2 border-t border-gray-100"
              >
                <View
                  className={`mt-1.5 w-1.5 h-1.5 rounded-full ${
                    row.runtime ? 'bg-blue-400' : 'bg-gray-300'
                  }`}
                />
                <View className="flex-1">
                  <Text className="text-[13px] font-medium text-gray-800">
                    {row.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {row.purpose}
                    {row.runtime ? ' · xin lúc chạy' : ' · khai báo'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="mt-4">
    <Text className="text-xs font-semibold text-gray-500 uppercase px-6 mb-1">
      {title}
    </Text>
    <View className="bg-white mx-4 px-4 rounded-xl" style={styles.box}>
      {children}
    </View>
  </View>
);

const RowWrapper = ({
  children,
  isLast,
}: {
  children: React.ReactNode;
  isLast: boolean;
}) => (
  <View className={isLast ? '' : 'border-b border-gray-100'}>{children}</View>
);

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
        shadowColor: '#222',
      },
    }),
  },
});

export default PermissionsScreen;
