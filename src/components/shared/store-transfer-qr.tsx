import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle } from 'react-native-svg';

// TODO(BE): lấy TTL token từ backend nếu response có trả; tạm hardcode 5 phút.
const DEFAULT_TTL_MS = 5 * 60_000;
const QR_SIZE = 220;

// Vòng progress quanh đồng hồ: vơi dần theo % thời gian còn lại.
const TIMER_SIZE = 56;
const TIMER_STROKE = 3;
const TIMER_RADIUS = (TIMER_SIZE - TIMER_STROKE) / 2;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const formatTime = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

type Props = {
  token: string;
  /**
   * Tiêu đề màn QR. Mặc định "Chuyển Siêu Thị" (NV đang chuyển siêu thị). Màn
   * onboarding NV mới truyền "Cấp Quyền Siêu Thị".
   */
  title?: string;
  storeName?: string;
  /**
   * Hướng dẫn ngắn dưới tên siêu thị (vd. đưa mã cho Quản lý / Trưởng ca quét
   * để cấp quyền). Chỉ hiển thị khi có truyền.
   */
  hint?: string;
  employeeCode?: string;
  employeeName?: string;
  ttlMs?: number;
  /** Giảm padding trên (màn onboarding cấp quyền). */
  compact?: boolean;
  /**
   * Ép QR về trạng thái hết hạn ngay (timer 0:00, QR mờ + overlay) — dùng khi
   * đã được duyệt nên mã không còn giá trị. Không gọi onExpire.
   */
  forceExpired?: boolean;
  onExpire?: () => void;
  /** Có onRegenerate thì khi hết hạn cho phép chạm QR / bấm nút để tạo lại mã. */
  onRegenerate?: () => void;
};

/**
 * Màn "QR Code Chuyển Siêu Thị" (presentational): render token thành QR kèm đồng
 * hồ đếm ngược. SM/TC quét mã này để duyệt nhân viên vào siêu thị.
 * Dùng ở 2 nơi (đều render trực tiếp, không qua route): inline trong onboarding
 * NV mới, và overlay Portal khi NV chuyển siêu thị (store-selection).
 */
const StoreTransferQR = ({
  token,
  title = 'QR Code chuyển siêu thị',
  storeName,
  hint,
  employeeCode,
  employeeName,
  ttlMs = DEFAULT_TTL_MS,
  compact = false,
  forceExpired = false,
  onExpire,
  onRegenerate,
}: Props) => {
  const [remainingMs, setRemainingMs] = useState(ttlMs);
  const endAtRef = useRef(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // 1 → 0 trong đúng ttlMs, chạy song song với interval đếm chữ.
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (forceExpired || !token) {
      progressAnim.setValue(0);
      return;
    }
    progressAnim.setValue(1);
    const anim = Animated.timing(progressAnim, {
      toValue: 0,
      duration: ttlMs,
      easing: Easing.linear,
      // stroke của react-native-svg không chạy được trên native driver
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [token, ttlMs, forceExpired, progressAnim]);

  useEffect(() => {
    // Đã duyệt → về 0:00 ngay, không chạy countdown và không bắn onExpire.
    if (forceExpired) {
      setRemainingMs(0);
      return;
    }

    // Reset đồng hồ mỗi khi token đổi (lần đầu hoặc "Tạo lại mã").
    endAtRef.current = Date.now() + ttlMs;
    setRemainingMs(ttlMs);

    const id = setInterval(() => {
      const left = endAtRef.current - Date.now();
      if (left <= 0) {
        clearInterval(id);
        setRemainingMs(0);
        onExpireRef.current?.();
      } else {
        setRemainingMs(left);
      }
    }, 250);

    return () => clearInterval(id);
  }, [token, ttlMs, forceExpired]);

  const hasToken = !!token;
  const expired = forceExpired || remainingMs <= 0 || !hasToken;

  return (
    <View className={`items-center px-6 ${compact ? 'pb-6 pt-1' : 'py-8'}`}>
      <Text className="mb-1 text-center text-xl font-bold text-gray-900">
        {title}
      </Text>
      {!!storeName && (
        <Text className="mb-5 text-center text-base font-semibold text-gray-400">
          {storeName}
        </Text>
      )}
      {!!hint && (
        <Text className="mb-5 px-2 text-center text-sm leading-5 text-gray-500">
          {hint}
        </Text>
      )}

      {/* Svg là phần tử layout (đúng 56px), text overlay absolute lên chính
          giữa cùng box → ring và số luôn đồng tâm, không phụ thuộc rem/h-14. */}
      <View className="mb-5">
        <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
          {/* Track nền; hết hạn thì thành vòng đỏ đầy như cũ */}
          <Circle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={TIMER_RADIUS}
            stroke={expired ? '#f87171' : '#e5e7eb'}
            strokeWidth={TIMER_STROKE}
            fill="none"
          />
          {!expired && (
            <AnimatedCircle
              cx={TIMER_SIZE / 2}
              cy={TIMER_SIZE / 2}
              r={TIMER_RADIUS}
              stroke="#3b82f6"
              strokeWidth={TIMER_STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${TIMER_CIRCUMFERENCE} ${TIMER_CIRCUMFERENCE}`}
              // Offset âm → phần trống lan theo chiều kim đồng hồ (trái qua phải)
              strokeDashoffset={progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-TIMER_CIRCUMFERENCE, 0],
              })}
              // Xoay trong toạ độ SVG để mốc bắt đầu nằm ở đỉnh (12h)
              transform={`rotate(-90 ${TIMER_SIZE / 2} ${TIMER_SIZE / 2})`}
            />
          )}
        </Svg>
        <View
          style={StyleSheet.absoluteFill}
          className="items-center justify-center"
        >
          <Text
            className={`text-sm font-semibold ${expired ? 'text-red-500' : 'text-blue-600'}`}
          >
            {formatTime(remainingMs)}
          </Text>
        </View>
      </View>

      <View className="rounded-2xl bg-white p-4" style={styles.qrCard}>
        <View
          style={{ width: QR_SIZE, height: QR_SIZE }}
          className="items-center justify-center"
        >
          {hasToken ? (
            // Hết hạn: giữ nguyên QR nhưng làm mờ (disabled), không xoá trống chỗ.
            <View style={expired ? styles.qrDimmed : undefined}>
              <QRCode
                value={token}
                size={QR_SIZE}
                backgroundColor="transparent"
              />
            </View>
          ) : (
            <View className="h-full w-full rounded-lg bg-gray-100" />
          )}

          {expired && (
            <TouchableOpacity
              onPress={onRegenerate}
              disabled={!onRegenerate}
              activeOpacity={0.85}
              className="items-center justify-center"
              style={StyleSheet.absoluteFillObject}
            >
              <View
                className="items-center gap-2 rounded-2xl px-6 py-4"
                style={styles.expiredChip}
              >
                <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                  <Ionicons name="refresh" size={24} color="#ffffff" />
                </View>
                <Text className="text-sm font-bold text-red-500">
                  Mã đã hết hạn
                </Text>
                {!!onRegenerate && (
                  <Text className="text-lg font-bold text-blue-600">
                    Chạm để tạo lại
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!!employeeCode && (
        <Text className="mt-5 text-center text-base font-bold uppercase text-gray-900">
          {employeeCode}
        </Text>
      )}
      {!!employeeName && (
        <Text className="text-center text-base font-semibold text-gray-700">
          {employeeName}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  qrCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  qrDimmed: {
    opacity: 0.35,
  },
  expiredChip: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
});

export default React.memo(StoreTransferQR);
