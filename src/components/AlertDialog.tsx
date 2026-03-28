import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { AlertInstance } from '../core/store/alert-dialog';
import { hideAlert, useAlertStore } from '../core/store/alert-dialog';

function AlertModalBody({
  current,
  onConfirmPress,
  onCancelPress,
}: {
  current: AlertInstance;
  onConfirmPress: () => void;
  onCancelPress: () => void;
}) {
  const {
    title,
    message,
    cancelText,
    confirmText,
    isHideCancelButton,
    isHideConfirmButton,
    blockDismiss,
    loading,
  } = current;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Modal
        animationType="fade"
        transparent
        visible
        onRequestClose={blockDismiss ? () => {} : onCancelPress}
      >
        <View style={styles.modalBackground}>
          <View className=" bg-white rounded-lg" style={{ width: 270 }}>
            <View className="px-4 py-5">
              {title &&
                (typeof title === 'string' ? (
                  <Text className="text-center text-lg font-semibold">
                    {title}
                  </Text>
                ) : (
                  <View className="items-center">{title}</View>
                ))}
              {message &&
                (typeof message === 'string' ? (
                  <Text
                    className="text-center text-sm mt-2"
                    style={{ lineHeight: 20 }}
                  >
                    {message}
                  </Text>
                ) : (
                  <View
                    className="items-center mt-2"
                    style={{ alignSelf: 'stretch' }}
                  >
                    {message}
                  </View>
                ))}
            </View>
            <View className="flex flex-row w-full border-t border-gray-200">
              {!isHideCancelButton && (
                <View
                  className={`flex-1 py-3 ${!isHideConfirmButton ? 'border-r border-gray-200' : ''}`}
                >
                  <TouchableOpacity onPress={onCancelPress}>
                    <Text className="text-center text-blue-500 text-lg">
                      {cancelText || 'Trở lại'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {!isHideConfirmButton && (
                <View className="flex-1 py-3">
                  <TouchableOpacity onPress={onConfirmPress} disabled={loading}>
                    <View className="flex flex-row justify-center items-center gap-2">
                      {loading && (
                        <ActivityIndicator size="small" color="blue" />
                      )}
                      <Text className="text-center text-blue-500 text-lg font-semibold">
                        {' '}
                        {confirmText || 'Xác nhận'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const AlertDialog = () => {
  const alerts = useAlertStore.use.alerts();
  const current = alerts[0];

  /** Chỉ gọi callback — đóng queue là việc của callback (hideAlert trong onConfirm). */
  const onConfirmPress = useCallback(() => {
    const c = useAlertStore.getState().alerts[0];
    if (!c) return;
    c.onConfirm();
  }, []);

  /** Trở lại / Android back: gọi onCancel rồi tự pop — không ghi đè logic custom ngoài thứ tự này. */
  const onCancelPress = useCallback(() => {
    const c = useAlertStore.getState().alerts[0];
    if (!c) return;
    c.onCancel?.();
    hideAlert();
  }, []);

  if (!current) return null;

  return (
    <AlertModalBody
      current={current}
      onConfirmPress={onConfirmPress}
      onCancelPress={onCancelPress}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default AlertDialog;
