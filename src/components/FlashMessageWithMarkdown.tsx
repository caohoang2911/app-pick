import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { hideMessage } from 'react-native-flash-message';
import { MarkdownText } from '@/core/utils/markdown';

/** Màu nền theo type (theme của react-native-flash-message) */
const FLASH_TYPE_BG: Record<
  string,
  { bg: string; text: string; close: string; link?: string }
> = {
  success: { bg: '#5cb85c', text: '#fff', close: 'rgba(255,255,255,0.9)' },
  danger: { bg: '#d9534f', text: '#fff', close: 'rgba(255,255,255,0.9)' },
  info: { bg: '#5bc0de', text: '#fff', close: 'rgba(255,255,255,0.9)' },
  warning: {
    bg: '#f0ad4e',
    text: '#1a1a1a',
    close: 'rgba(0,0,0,0.7)',
    link: '#0d47a1',
  },
  default: { bg: '#696969', text: '#fff', close: 'rgba(255,255,255,0.9)' },
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingVertical: 18,
    paddingLeft: 16,
    paddingRight: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    overflow: 'hidden',
  },
  closeBtnQuarter: {
    position: 'absolute',
    top: -36,
    right: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  closeBtnIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
    ...(Platform.OS === 'android' && { textAlignVertical: 'center' }),
  },
});

export interface FlashMessageWithMarkdownMessage {
  message?: string;
  title?: string;
  description?: string;
  type?: string;
}

export interface FlashMessageWithMarkdownProps {
  message?: FlashMessageWithMarkdownMessage | null;
  style?: object;
}

/** Chỉ render title + message (markdown) + nút đóng, không render message mặc định (tránh dup). Nền + chữ theo type. */
const FlashMessageWithMarkdown = React.forwardRef<
  unknown,
  FlashMessageWithMarkdownProps
>(function FlashMessageWithMarkdown({ message, style }, _ref) {
  if (!message) return null;
  const type = message.type ?? 'default';
  const theme = FLASH_TYPE_BG[type] ?? FLASH_TYPE_BG.default;
  const title = message.title ?? message.description ?? '';
  const body = message.message ?? '';

  return (
    <Pressable
      style={[styles.wrap, { backgroundColor: theme.bg }, style]}
      onPress={() => hideMessage()}
    >
      <View style={styles.content}>
        {title !== '' && (
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {body !== '' && (
          <MarkdownText
            textStyle={{
              ...styles.body,
              color: theme.text,
            }}
            linkStyle={theme.link ? { color: theme.link } : undefined}
          >
            {body}
          </MarkdownText>
        )}
      </View>
      <TouchableOpacity
        style={styles.closeBtn}
        activeOpacity={0.8}
        onPress={(e) => {
          e?.stopPropagation?.();
          hideMessage();
        }}
      >
        <View style={styles.closeBtnIcon}>
          <View style={styles.closeBtnIconInner}>
            <Text
              style={[
                styles.closeText,
                {
                  color: theme.close,
                  textShadowColor: 'rgba(0,0,0,0.35)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 1,
                },
              ]}
            >
              ✕
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Pressable>
  );
});

export default FlashMessageWithMarkdown;
