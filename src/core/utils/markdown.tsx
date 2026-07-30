import React from 'react';
import { Text, Linking, TextStyle } from 'react-native';

interface MarkdownTextProps {
  children: string;
  className?: string;
  style?: TextStyle;
  textStyle?: TextStyle;
  linkStyle?: TextStyle;
  fadeBrackets?: boolean; // Làm mờ [text] không phải link
}

/**
 * Simple markdown parser cho React Native
 * Hỗ trợ: *bold*, _italic_, [link](url)
 *
 * Plain text để string trong Text cha (không bọc Text riêng) để giữ cùng font
 * với NativeWind className — tránh Android đổi typeface khi mỗi span có fontWeight.
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
  className,
  style,
  textStyle,
  linkStyle,
  fadeBrackets = false,
}) => {
  if (!children) return null;

  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let key = 0;

  // Regex patterns - ưu tiên link trước
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const boldPattern = /\*(.+?)\*/g;
  const italicPattern = /_(.+?)_/g;
  const bracketPattern = /\[([^\]]+)\](?!\()/g; // [text] không phải link
  const headingPattern = /^(#{1,6})[ \t]+(.+)$/gm; // ### Heading (theo dòng)

  const matches: Array<{
    type: 'bold' | 'italic' | 'link' | 'bracket' | 'heading';
    start: number;
    end: number;
    content: string;
    url?: string;
  }> = [];

  // Tìm heading trước (chiếm trọn dòng, bỏ dấu #)
  let match: RegExpExecArray | null;
  headingPattern.lastIndex = 0;
  while ((match = headingPattern.exec(children)) !== null) {
    matches.push({
      type: 'heading',
      start: match.index,
      end: match.index + match[0].length,
      content: match[2],
    });
  }

  // Tìm links trước
  linkPattern.lastIndex = 0;
  while ((match = linkPattern.exec(children)) !== null) {
    matches.push({
      type: 'link',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
      url: match[2],
    });
  }

  // Tìm bold (không overlap với link)
  boldPattern.lastIndex = 0;
  while ((match = boldPattern.exec(children)) !== null) {
    const isInsideLink = matches.some(
      (m) =>
        m.type === 'link' && match!.index >= m.start && match!.index < m.end,
    );
    if (!isInsideLink) {
      matches.push({
        type: 'bold',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }
  }

  // Tìm italic (không overlap với link hoặc bold)
  italicPattern.lastIndex = 0;
  while ((match = italicPattern.exec(children)) !== null) {
    const isInsideLinkOrBold = matches.some(
      (m) =>
        (m.type === 'link' || m.type === 'bold') &&
        match!.index >= m.start &&
        match!.index < m.end,
    );
    if (!isInsideLinkOrBold) {
      matches.push({
        type: 'italic',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }
  }

  // Tìm [text] trong ngoặc vuông (không phải link) - chỉ khi fadeBrackets = true
  if (fadeBrackets) {
    bracketPattern.lastIndex = 0;
    while ((match = bracketPattern.exec(children)) !== null) {
      const isInsideLink = matches.some(
        (m) =>
          m.type === 'link' && match!.index >= m.start && match!.index < m.end,
      );
      if (!isInsideLink) {
        matches.push({
          type: 'bracket',
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
        });
      }
    }
  }

  // Sắp xếp và xử lý overlap
  matches.sort((a, b) => a.start - b.start);
  const processedMatches: typeof matches = [];
  for (const match of matches) {
    const overlaps = processedMatches.some(
      (pm) =>
        (match.start >= pm.start && match.start < pm.end) ||
        (match.end > pm.start && match.end <= pm.end) ||
        (match.start <= pm.start && match.end >= pm.end),
    );

    if (!overlaps) {
      processedMatches.push(match);
    } else if (match.type === 'link') {
      // Link có ưu tiên cao nhất
      const index = processedMatches.findIndex(
        (pm) =>
          (match.start >= pm.start && match.start < pm.end) ||
          (match.end > pm.start && match.end <= pm.end) ||
          (match.start <= pm.start && match.end >= pm.end),
      );
      if (index !== -1) {
        processedMatches[index] = match;
      }
    }
  }

  processedMatches.sort((a, b) => a.start - b.start);

  // Build parts — text thường là string để inherit font từ Text cha
  for (const match of processedMatches) {
    if (match.start > currentIndex) {
      const textBefore = children.substring(currentIndex, match.start);
      if (textBefore) {
        parts.push(textBefore);
      }
    }

    if (match.type === 'bold' || match.type === 'heading') {
      parts.push(
        <Text key={`bold-${key++}`} style={{ fontWeight: '700' }}>
          {match.content}
        </Text>,
      );
    } else if (match.type === 'italic') {
      parts.push(
        <Text key={`italic-${key++}`} style={{ fontStyle: 'italic' }}>
          {match.content}
        </Text>,
      );
    } else if (match.type === 'link') {
      parts.push(
        <Text
          key={`link-${key++}`}
          style={[{ textDecorationLine: 'underline' }, linkStyle]}
          onPress={() => {
            if (match.url) {
              Linking.openURL(match.url).catch((err) =>
                console.error('Failed to open URL:', err),
              );
            }
          }}
        >
          {match.content}
        </Text>,
      );
    } else if (match.type === 'bracket') {
      parts.push(
        <Text key={`bracket-${key++}`} style={{ opacity: 0.5 }}>
          [{match.content}]
        </Text>,
      );
    }

    currentIndex = match.end;
  }

  if (currentIndex < children.length) {
    const textAfter = children.substring(currentIndex);
    if (textAfter) {
      parts.push(textAfter);
    }
  }

  return (
    <Text className={className} style={[style, textStyle]}>
      {parts.length > 0 ? parts : children}
    </Text>
  );
};
