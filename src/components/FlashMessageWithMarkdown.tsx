import Ionicons from '@expo/vector-icons/Ionicons';
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

/** Màu nền theo type — layout chuẩn toast (icon | nội dung | kẻ | đóng) */
const FLASH_TYPE_THEME: Record<string, { bg: string; icon: keyof typeof Ionicons.glyphMap }> =
  {
    success: { bg: '#27ae60', icon: 'checkmark-circle' },
    danger: { bg: '#c0392b', icon: 'close-circle' },
    error: { bg: '#c0392b', icon: 'close-circle' },
    info: { bg: '#2980b9', icon: 'information-circle' },
    warning: { bg: '#f39c12', icon: 'warning-outline' },
    default: { bg: '#696969', icon: 'information-circle-outline' },
  };

const TEXT_COLOR = '#fff';
const LINK_COLOR = 'rgba(255,255,255,0.95)';

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 4,
    overflow: 'hidden',
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
  iconWrap: {
    marginRight: 10,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
    paddingRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    color: TEXT_COLOR,
    letterSpacing: 0.15,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginVertical: 4,
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: '300',
    color: TEXT_COLOR,
    lineHeight: 18,
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

/** Title + message (markdown), layout: icon trái | nội dung | kẻ dọc | đóng. */
const FlashMessageWithMarkdown = React.forwardRef<
  unknown,
  FlashMessageWithMarkdownProps
>(function FlashMessageWithMarkdown({ message, style }, _ref) {
  if (!message) return null;
  const type = message.type ?? 'default';
  const theme = FLASH_TYPE_THEME[type] ?? FLASH_TYPE_THEME.default;
  const title = message.title ?? message.description ?? '';
  const body = message.message ?? '';

  return (
    <Pressable
      style={[styles.wrap, { backgroundColor: theme.bg }, style]}
      onPress={() => hideMessage()}
    >
      <View style={styles.iconWrap} pointerEvents="none">
        <Ionicons name={theme.icon} size={24} color={TEXT_COLOR} />
      </View>
      <View style={styles.content}>
        {title !== '' && (
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        )}
        {body !== '' && (
          <MarkdownText
            textStyle={styles.body}
            linkStyle={{ color: LINK_COLOR, textDecorationLine: 'underline' }}
          >
            {body}
          </MarkdownText>
        )}
      </View>
      <View style={styles.divider} pointerEvents="none" />
      <TouchableOpacity
        style={styles.closeBtn}
        activeOpacity={0.7}
        onPress={(e) => {
          e?.stopPropagation?.();
          hideMessage();
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Pressable>
  );
});

export default FlashMessageWithMarkdown;
