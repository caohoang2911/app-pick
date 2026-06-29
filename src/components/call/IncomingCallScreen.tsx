import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { answerFromApp, endCall } from '@/core/services/stringee';
import { useCall } from '@/core/store/call';

/**
 * Màn hình cuộc gọi đến trong app (foreground).
 * Trên iOS/Android, màn hình gọi gốc (CallKit/ConnectionService) là UI chính khi
 * máy khoá/app ở nền; màn hình này đảm bảo trải nghiệm nhất quán khi app đang mở.
 */
export function IncomingCallScreen() {
  const status = useCall.use.status();
  const callUuid = useCall.use.callUuid();
  const fromAlias = useCall.use.fromAlias();
  const fromNumber = useCall.use.fromNumber();

  if (status !== 'incoming') return null;

  const name = fromAlias || fromNumber || 'Tổng đài';

  return (
    <Modal animationType="fade" visible>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.label}>Cuộc gọi đến</Text>
          <Text style={styles.caller}>{name}</Text>
          {!!fromNumber && fromNumber !== name && (
            <Text style={styles.sub}>{fromNumber}</Text>
          )}
        </View>

        <View style={styles.avatar}>
          <Ionicons name="person" size={72} color="#fff" />
        </View>

        <View style={styles.actions}>
          <View style={styles.action}>
            <TouchableOpacity
              style={[styles.circle, styles.reject]}
              onPress={() => callUuid && endCall(callUuid)}
              accessibilityLabel="Từ chối"
            >
              <Ionicons
                name="call"
                size={32}
                color="#fff"
                style={{ transform: [{ rotate: '135deg' }] }}
              />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Từ chối</Text>
          </View>

          <View style={styles.action}>
            <TouchableOpacity
              style={[styles.circle, styles.answer]}
              onPress={() => callUuid && answerFromApp(callUuid)}
              accessibilityLabel="Trả lời"
            >
              <Ionicons name="call" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Trả lời</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b3d91',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 96,
    paddingBottom: 72,
  },
  header: { alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 12 },
  caller: { color: '#fff', fontSize: 28, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 6 },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 48,
  },
  action: { alignItems: 'center', gap: 10 },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reject: { backgroundColor: '#dc2626' },
  answer: { backgroundColor: '#16a34a' },
  actionLabel: { color: '#fff', fontSize: 14 },
});
