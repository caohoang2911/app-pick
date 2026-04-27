import { useOtaUpdateReadyModal } from '@/core/store/ota-update-modal';
import { colors } from '@/ui/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { Button } from '~/src/components/Button';
import { Linking, Modal, StyleSheet, Text, View } from 'react-native';
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
  const setPendingRestart = useOtaUpdateReadyModal((s) => s.setPendingRestart);
  const insets = useSafeAreaInsets();
  const [isReloading, setIsReloading] = useState(false);
  const handleRestartApp = async () => {
    if (isReloading) return;
    setIsReloading(true);

    setPendingRestart(true);
    // Give camera time to deactivate native session before reload
    await new Promise((r) => setTimeout(r, 500));

    try {
      if (Updates?.reloadAsync) {
        await Updates.reloadAsync();
        return;
      }
      await Linking.openSettings();
      setIsReloading(false);
    } catch {
      setIsReloading(false);
    }
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

          <Text style={styles.title}>Vui lòng mở lại ứng dụng!</Text>

          <Button
            label="Mở lại app"
            onPress={handleRestartApp}
            disabled={isReloading}
            loading={isReloading}
            className="mt-2"
            labelClasses="text-white font-bold"
          />
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
  footerNote: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: 'red',
    textAlign: 'center',
    marginBottom: 14,
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
