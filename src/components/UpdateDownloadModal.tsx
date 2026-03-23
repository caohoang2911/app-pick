import { colors } from '@/ui/colors';
import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

type UpdateDownloadModalProps = {
  visible: boolean;
  progress: number;
};

export function UpdateDownloadModal({
  visible,
  progress,
}: UpdateDownloadModalProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.root} pointerEvents="auto" accessibilityViewIsModal>
        <View style={styles.backdrop} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <DownloadIcon />
            </View>
            <Text style={styles.kicker}>Cập nhật bắt buộc</Text>
            <Text style={styles.title}>Đang tải bản cài đặt mới</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.percentRow}>
              <Text style={styles.percentValue}>{pct}</Text>
              <Text style={styles.percentSign}>%</Text>
            </View>

            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${pct}%` }]} />
            </View>

            <View style={styles.hint}>
              <InfoIcon />
              <Text style={styles.hintText}>
                Không thoát ứng dụng trong lúc tải. Giữ kết nối mạng ổn định.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DownloadIcon() {
  return (
    <View style={iconStyles.wrap}>
      <View style={iconStyles.arrowDown} />
      <View style={iconStyles.line} />
      <View style={iconStyles.base} />
    </View>
  );
}

function InfoIcon() {
  return (
    <View style={infoIconStyles.circle}>
      <View style={infoIconStyles.dot} />
      <View style={infoIconStyles.bar} />
    </View>
  );
}

const PRIMARY = '#1A6FD4';
const PRIMARY_BG = '#EEF5FD';
const PRIMARY_TEXT = '#1A5FAD';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,20,40,0.82)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  title: {
    fontSize: 21,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 28,
  },
  body: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  percentValue: {
    fontSize: 48,
    fontWeight: '500',
    color: colors.contentPrimary,
    lineHeight: 56,
  },
  percentSign: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.gray[500],
    marginLeft: 3,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.bgPrimary,
    overflow: 'hidden',
    marginBottom: 20,
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: PRIMARY_BG,
    borderRadius: 12,
    padding: 14,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY_TEXT,
    lineHeight: 20,
  },
});

const iconStyles = StyleSheet.create({
  wrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginBottom: 1,
  },
  line: { width: 2, height: 6, backgroundColor: '#fff', marginBottom: 1 },
  base: { width: 14, height: 2, backgroundColor: '#fff' },
});

const infoIconStyles = StyleSheet.create({
  circle: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: PRIMARY,
    marginBottom: 1,
  },
  bar: { width: 2, height: 5, borderRadius: 1, backgroundColor: PRIMARY },
});
