import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  closeOtaUpdateReadyModal,
  useOtaUpdateReadyModal,
} from '@/core/store/ota-update-modal';
import { colors } from '@/ui/colors';

/**
 * Modal OTA sau khi fetch xong: không reload trong app.
 * Không cho đóng — user phải thoát hẳn app rồi mở lại (trừ __DEV__ có nút đóng để test).
 */
export function OtaUpdateReadyModal() {
  const visible = useOtaUpdateReadyModal((s) => s.visible);
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.root} pointerEvents="box-none">
        <View style={styles.backdrop} />
        <View
          style={[styles.card, { marginBottom: Math.max(insets.bottom, 8) }]}
          accessibilityViewIsModal
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="cloud-download"
              size={32}
              color={colors.colorPrimary}
            />
          </View>

          <Text style={styles.title}>Có bản cập nhật mới</Text>

          <Text style={styles.body}>
            Bản cập nhật đã tải xong.{' '}
            <Text style={styles.bodyEmphasis}>Bạn phải mở lại ứng dụng</Text> để
            áp dụng bản cập nhật mới.
          </Text>

          <Text style={styles.footerNote}>Yêu cầu này là bắt buộc</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blue[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 12,
  },
  bodyEmphasis: {
    fontWeight: '700',
    color: '#0F172A',
  },
  footerNote: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  devClose: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  devCloseText: {
    fontSize: 12,
    color: colors.gray[500],
    textDecorationLine: 'underline',
  },
});
