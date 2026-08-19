import { router } from 'expo-router';
import { isEmpty } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import {
  useSafeAreaInsets,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  usePollQRAccessTokenStatus,
  QRAccessTokenStatus,
} from '~/src/api/app-pick/use-get-qr-access-token-info';
import { useRequestAssignMeToStore } from '~/src/api/app-pick/use-request-assign-me-to-store';
import { useGetConfig } from '~/src/api/config/use-get-config';
// Nhóm Telegram nhận thông báo duyệt cấp quyền — SM/TC gửi yêu cầu xong tham
// gia để theo dõi trạng thái. Dùng chung link với màn hình Cài đặt.
import { TELEGRAM_GROUP_LINK as TELEGRAM_LINK } from '~/src/core/constants/telegram';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { useAuth } from '~/src/core/store/auth';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { StoreLine, CloseLine } from '~/src/core/svgs';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import { EmployeeRole } from '~/src/types/employee';
import { Button } from '../Button';
import SDropdown from '../SDropdown';
import StoreTransferQR from './store-transfer-qr';

type StoreType = Option & { address: string; tenant: string };

// Modal chọn siêu thị cao ~70% màn hình — chỉ áp cho dropdown này, không ảnh
// hưởng các SDropdown khác.
const STORE_DROPDOWN_MAX_HEIGHT = Math.round(
  Dimensions.get('window').height * 0.7,
);

interface Props {
  code?: string | null;
}

const ROLE_OPTIONS: { value: EmployeeRole; label: string }[] = [
  { value: EmployeeRole.STORE_MANAGER, label: 'Quản Lý Siêu Thị (SM)' },
  {
    value: EmployeeRole.STORE_SHIFT_SUPERVISOR,
    label: 'Trưởng Ca Siêu Thị (TC)',
  },
  { value: EmployeeRole.STORE, label: 'Nhân Viên Siêu Thị' },
  {
    value: EmployeeRole.STORE_FULLTIME_PICKER,
    label: 'Fulltime Picker Siêu Thị',
  },
];

// Guideline đổi theo role đang chọn.
const MANAGER_GUIDELINE = [
  'Chọn siêu thị bạn quản lý',
  'Gửi yêu cầu, hệ thống thông báo lên nhóm Telegram',
  'Đợi Admin duyệt và đăng nhập lại',
];

const EMPLOYEE_GUIDELINE = [
  'Chọn siêu thị bạn sẽ làm việc',
  'Tạo mã QR và đưa Quản lý / Trưởng ca siêu thị quét duyệt',
  'Đăng nhập lại để bắt đầu',
];

const QR_APPROVAL_ROLES = new Set<EmployeeRole>([
  EmployeeRole.STORE,
  EmployeeRole.STORE_FULLTIME_PICKER,
]);

const usesQrApproval = (role: EmployeeRole | null) =>
  role != null && QR_APPROVAL_ROLES.has(role);

const GUIDELINES: Record<string, string[]> = {
  [EmployeeRole.STORE]: EMPLOYEE_GUIDELINE,
  [EmployeeRole.STORE_FULLTIME_PICKER]: EMPLOYEE_GUIDELINE,
  [EmployeeRole.STORE_MANAGER]: MANAGER_GUIDELINE,
  [EmployeeRole.STORE_SHIFT_SUPERVISOR]: MANAGER_GUIDELINE,
};

const DEFAULT_GUIDELINE = [
  'Chọn phân quyền bạn cần',
  'Chọn siêu thị bạn sẽ làm việc',
  'Gửi yêu cầu và đợi duyệt',
];

const Step = ({ index, text }: { index: number; text: string }) => (
  <View className="flex-row items-center gap-3">
    <View className="h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
      <Text className="text-xs font-bold text-blue-600">{index}</Text>
    </View>
    <View className="min-w-0 flex-1">
      <Text className="text-sm text-gray-700">{text}</Text>
    </View>
  </View>
);

const RequestPermissionStore = ({ code }: Props) => {
  const insets = useSafeAreaInsets();
  const version = useConfig.use.version();
  const config = useConfig.use.config();
  const userInfo = useAuth.use.userInfo();

  const { refetch, isFetching } = useGetConfig({ localVersion: version });

  // Mặc định chọn Nhân Viên Siêu Thị (role phổ biến nhất khi đăng ký).
  const [selectedRole, setSelectedRole] = useState<EmployeeRole | null>(
    EmployeeRole.STORE,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Đã được duyệt → giữ màn QR nhưng ép mã về hết hạn, không cho tạo lại.
  const [approved, setApproved] = useState(false);

  // Đọc role hiện tại trong callback thành công (callback tạo 1 lần).
  const selectedRoleRef = useRef(selectedRole);
  selectedRoleRef.current = selectedRole;

  const employeeCode = code || userInfo?.username || '';

  const onRequestSuccess = useCallback((newToken: string) => {
    if (usesQrApproval(selectedRoleRef.current)) {
      // NV/Fulltime Picker → hiển thị mã QR để SM/TC quét duyệt tại chỗ.
      setApproved(false);
      setToken(newToken);
    } else {
      // SM/TC → bot Telegram báo group, chờ Admin duyệt. Kèm link nhóm Telegram
      // (markdown → FlashMessageWithMarkdown render thành link bấm được) như cũ.
      showMessage({
        message: `Đã gửi yêu cầu cấp quyền, vui lòng chờ Admin duyệt và đăng nhập lại. Tham gia nhóm để cập nhật thông báo: [${TELEGRAM_LINK}](${TELEGRAM_LINK}).`,
        type: 'success',
        duration: 10000,
      });
      router.replace('/login');
    }
  }, []);

  const { mutate: requestAssignMeToStore } =
    useRequestAssignMeToStore(onRequestSuccess);

  useEffect(() => {
    if (isEmpty(config)) refetch();
  }, [config]);

  useEffect(() => {
    setLoading(isFetching);
  }, [isFetching]);

  const stores = useMemo<StoreType[]>(
    () => (config?.stores as StoreType[]) ?? [],
    [config?.stores],
  );

  // Data cho SDropdown (modal): lọc theo từ khoá, cap 50, luôn kèm store đang
  // chọn (khi chưa search) để trigger hiển thị đúng tên.
  const storeData = useMemo(() => {
    const q = stringUtils.removeAccents(searchQuery.trim().toLowerCase());
    const matched = q
      ? stores.filter((store) =>
          stringUtils
            .removeAccents((store.name || '').toLowerCase())
            .includes(q),
        )
      : stores;
    const list = matched.slice(0, 50).map((store) => ({
      id: String(store.id),
      name: store.name ?? '',
      subtitle: store.address ?? '',
    }));
    if (
      selectedStore &&
      !list.some((it) => it.id === String(selectedStore.id))
    ) {
      list.unshift({
        id: String(selectedStore.id),
        name: selectedStore.name ?? '',
        subtitle: selectedStore.address ?? '',
      });
    }
    return list;
  }, [stores, searchQuery, selectedStore]);

  const handleSelectStore = useCallback(
    (id: string) => {
      setSelectedStore(stores.find((s) => String(s.id) === id) ?? null);
    },
    [stores],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedRole || !selectedStore) return;
    setLoading(true);
    requestAssignMeToStore({
      employeeCode,
      storeCode: String(selectedStore.id),
      role: selectedRole,
    });
  }, [selectedRole, selectedStore, employeeCode, requestAssignMeToStore]);

  const handleBackFromQr = useCallback(() => {
    setToken(null);
    setApproved(false);
  }, []);

  // Đang hiển thị QR (NV) → poll trạng thái duyệt 1s/lần; duyệt xong thì ngừng.
  const isWaitingApproval =
    !!token && !approved && usesQrApproval(selectedRole);
  const approvedHandledRef = useRef(false);

  const { data: tokenInfo } = usePollQRAccessTokenStatus(
    token,
    isWaitingApproval,
  );

  useEffect(() => {
    approvedHandledRef.current = false;
  }, [token]);

  useEffect(() => {
    if (
      !isWaitingApproval ||
      approvedHandledRef.current ||
      tokenInfo?.status !== QRAccessTokenStatus.APPROVED
    ) {
      return;
    }
    approvedHandledRef.current = true;
    // Giữ màn QR phía sau alert nhưng đưa về trạng thái hết hạn (mã đã dùng xong).
    setApproved(true);
    showAlert({
      title: 'Cấp quyền thành công',
      message:
        'Bạn đã được duyệt vào siêu thị. Vui lòng đăng nhập lại để bắt đầu sử dụng app.',
      confirmText: 'Đăng nhập lại',
      isHideCancelButton: true,
      onConfirm: () => {
        hideAlert();
        router.replace('/login');
      },
    });
  }, [isWaitingApproval, tokenInfo?.status]);

  if (isFetching) return null;

  // NV gửi yêu cầu thành công → màn mã QR để SM/TC quét duyệt.
  if (token && usesQrApproval(selectedRole)) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <TouchableOpacity
          onPress={handleBackFromQr}
          hitSlop={12}
          className="absolute left-4 top-1 z-10 p-1"
        >
          <CloseLine width={24} height={24} color="#666" />
        </TouchableOpacity>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingTop: 40, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <StoreTransferQR
            token={token}
            title="QR Code cấp quyền siêu thị"
            hint="Vui lòng đưa mã này cho Quản lý / Trưởng ca siêu thị bạn chọn quét để cấp quyền."
            storeName={selectedStore?.name}
            employeeCode={employeeCode}
            // Tài khoản mới thường chưa có name trong userInfo → lấy từ payload
            // của poll getQRAccesTokenInfo (có sau nhịp poll đầu ~1s).
            employeeName={userInfo?.name || tokenInfo?.payload?.employeeName}
            compact
            forceExpired={approved}
            onRegenerate={approved ? undefined : handleSubmit}
          />
        </ScrollView>
        {/* Duyệt xong poll sẽ bắn alert "Đăng nhập lại" nên footer chỉ cần
            dòng hướng dẫn, không cần link điều hướng riêng. */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 8),
          }}
        >
          <Text className="mb-2 text-center text-sm text-gray-500">
            Sau khi được xác nhận cấp quyền thành công, vui lòng đăng nhập lại
            để bắt đầu.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const guideline = selectedRole ? GUIDELINES[selectedRole] : DEFAULT_GUIDELINE;
  const canSubmit = !!selectedRole && !!selectedStore;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1 px-4"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-blue-50">
            <StoreLine width={46} height={46} />
          </View>
          <Text className="mb-6 text-center text-xl font-bold text-gray-900">
            Cấp quyền vào Siêu Thị
          </Text>
        </View>

        {/* Chọn phân quyền */}
        <Text className="mb-3 text-lg font-bold text-gray-900">
          Chọn Phân Quyền
        </Text>
        <View className="mb-6 gap-1">
          {ROLE_OPTIONS.map((opt) => {
            const selected = selectedRole === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                className="flex-row items-center gap-3 py-2"
                onPress={() => setSelectedRole(opt.value)}
              >
                <View
                  className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-blue-600' : 'border-gray-400'}`}
                >
                  {selected && (
                    <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  )}
                </View>
                <Text className="text-base text-gray-800">{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chọn siêu thị */}
        <Text className="mb-3 text-lg font-bold text-gray-900">
          Chọn siêu thị
        </Text>
        <SDropdown
          mode="modal"
          showSearch
          maxHeight={STORE_DROPDOWN_MAX_HEIGHT}
          data={storeData}
          labelField="name"
          valueField="id"
          value={selectedStore ? String(selectedStore.id) : undefined}
          placeholder="Chọn siêu thị"
          searchPlaceholder="Tìm kiếm siêu thị"
          emptyText="Không tìm thấy siêu thị"
          onSearchChange={setSearchQuery}
          onSelect={handleSelectStore}
        />

        {/* Guideline theo role */}
        <Text className="mb-3 mt-8 text-base leading-6 text-gray-500">
          Tài khoản của bạn chưa thuộc siêu thị nào. Làm theo các bước sau để
          được cấp quyền sử dụng app:
        </Text>
        <View className="gap-4">
          {guideline.map((text, idx) => (
            <Step key={idx} index={idx + 1} text={text} />
          ))}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Button
          label="Yêu cầu cấp quyền siêu thị"
          size="md"
          className="h-12 w-full"
          onPress={handleSubmit}
          disabled={!canSubmit}
        />
      </View>
    </View>
  );
};

export default RequestPermissionStore;
