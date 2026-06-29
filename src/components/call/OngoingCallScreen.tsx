import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  endCall,
  toggleMuteFromApp,
  toggleSpeakerFromApp,
} from '@/core/services/stringee';
import { useCall } from '@/core/store/call';

function formatDuration(start: number | null): string {
  if (!start) return '00:00';
  const total = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function CircleButton({
  icon,
  label,
  active,
  danger,
  rotate,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  danger?: boolean;
  rotate?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.action}>
      <TouchableOpacity
        style={[
          styles.circle,
          active && styles.circleActive,
          danger && styles.circleDanger,
        ]}
        onPress={onPress}
        accessibilityLabel={label}
      >
        <Ionicons
          name={icon}
          size={28}
          color={danger || active ? '#fff' : '#0b3d91'}
          style={rotate ? { transform: [{ rotate: '135deg' }] } : undefined}
        />
      </TouchableOpacity>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

/** Màn hình đang trong cuộc gọi: tên người gọi, thời lượng, tắt mic / loa / kết thúc. */
export function OngoingCallScreen() {
  const status = useCall.use.status();
  const callUuid = useCall.use.callUuid();
  const fromAlias = useCall.use.fromAlias();
  const fromNumber = useCall.use.fromNumber();
  const isMuted = useCall.use.isMuted();
  const isSpeaker = useCall.use.isSpeaker();
  const answeredAt = useCall.use.answeredAt();
  const [, setTick] = useState(0);

  // Cập nhật đồng hồ đếm thời lượng mỗi giây.
  useEffect(() => {
    if (status !== 'answered') return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  if (status !== 'answered') return null;

  const name = fromAlias || fromNumber || 'Tổng đài';

  return (
    <Modal animationType="fade" visible>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.caller}>{name}</Text>
          <Text style={styles.sub}>{formatDuration(answeredAt)}</Text>
        </View>

        <View style={styles.avatar}>
          <Ionicons name="person" size={72} color="#fff" />
        </View>

        <View style={styles.actions}>
          <CircleButton
            icon={isMuted ? 'mic-off' : 'mic'}
            label={isMuted ? 'Bật mic' : 'Tắt mic'}
            active={isMuted}
            onPress={() => callUuid && toggleMuteFromApp(callUuid, !isMuted)}
          />
          <CircleButton
            icon={isSpeaker ? 'volume-high' : 'volume-medium'}
            label="Loa ngoài"
            active={isSpeaker}
            onPress={() =>
              callUuid && toggleSpeakerFromApp(callUuid, !isSpeaker)
            }
          />
          <CircleButton
            icon="call"
            label="Kết thúc"
            danger
            rotate
            onPress={() => callUuid && endCall(callUuid)}
          />
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
  caller: { color: '#fff', fontSize: 28, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 16, marginTop: 8 },
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
    paddingHorizontal: 32,
  },
  action: { alignItems: 'center', gap: 10 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  circleDanger: { backgroundColor: '#dc2626' },
  actionLabel: { color: '#fff', fontSize: 14 },
});
