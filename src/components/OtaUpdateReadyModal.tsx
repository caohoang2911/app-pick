import { useOtaUpdateReadyModal } from '@/core/store/ota-update-modal';
import { colors } from '@/ui/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch (error) {
  console.warn('[OtaUpdateReadyModal] expo-updates unavailable', error);
}

/**
 * Modal OTA sau khi fetch xong: không reload trong app.
 * Không cho đóng — user phải thoát hẳn app rồi mở lại (trừ __DEV__ có nút đóng để test).
 */
export function OtaUpdateReadyModal() {
  const visible = useOtaUpdateReadyModal((s) => s.visible);
  const setPendingRestart = useOtaUpdateReadyModal(
    (s) => s.setPendingRestart,
  );
  const insets = useSafeAreaInsets();
  const handleRestartApp = async () => {
    setPendingRestart(true);
    // Give camera time to deactivate native session before reload
    await new Promise((r) => setTimeout(r, 500));

    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
      return;
    }
    await Linking.openSettings();
  };

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
              size={28}
              color={colors.colorPrimary}
            />
          </View>

          <Text style={styles.title}>Cập nhật thành công</Text>

          <Text style={styles.body}>Vui lòng mở lại ứng dụng!</Text>

          <Pressable style={styles.primaryButton} onPress={handleRestartApp}>
            <Text style={styles.primaryButtonText}>Mở lại app</Text>
          </Pressable>
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
    width: 70,
    height: 70,
    borderRadius: 35,
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
    fontSize: 16,
    lineHeight: 22,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 10,
  },
  footerNote: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: 'red',
    textAlign: 'center',
    marginBottom: 14,
  },
  primaryButton: {
    minWidth: 170,
    borderRadius: 10,
    backgroundColor: colors.colorPrimary,
    paddingVertical: 11,
    paddingHorizontal: 18,
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  devClose: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  devCloseText: {
    fontSize: 13,
    color: colors.gray[600],
    textDecorationLine: 'underline',
  },
});
