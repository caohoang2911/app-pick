import React from 'react';
import { Text, Linking, TextStyle } from 'react-native';

interface MarkdownTextProps {
  children: string;
  style?: TextStyle;
  textStyle?: TextStyle;
  linkStyle?: TextStyle;
  fadeBrackets?: boolean; // Làm mờ [text] không phải link
}

/**
 * Simple markdown parser cho React Native
 * Hỗ trợ: **bold**, *italic*, [link](url)
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({
  children,
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
  const boldPattern = /(\*\*|__)(.+?)\1/g;
  const italicPattern = /(\*|_)(.+?)\1/g;
  const bracketPattern = /\[([^\]]+)\](?!\()/g; // [text] không phải link

  const matches: Array<{
    type: 'bold' | 'italic' | 'link' | 'bracket';
    start: number;
    end: number;
    content: string;
    url?: string;
  }> = [];

  // Tìm links trước
  let match: RegExpExecArray | null;
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
        content: match[2],
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
        content: match[2],
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

  // Build parts
  for (const match of processedMatches) {
    if (match.start > currentIndex) {
      const textBefore = children.substring(currentIndex, match.start);
      if (textBefore) {
        parts.push(
          <Text key={`text-${key++}`} style={[style, textStyle]}>
            {textBefore}
          </Text>,
        );
      }
    }

    if (match.type === 'bold') {
      parts.push(
        <Text
          key={`bold-${key++}`}
          style={[style, textStyle, { fontWeight: 'bold' }]}
        >
          {match.content}
        </Text>,
      );
    } else if (match.type === 'italic') {
      parts.push(
        <Text
          key={`italic-${key++}`}
          style={[style, textStyle, { fontStyle: 'italic' }]}
        >
          {match.content}
        </Text>,
      );
    } else if (match.type === 'link') {
      parts.push(
        <Text
          key={`link-${key++}`}
          style={[
            style,
            textStyle,
            linkStyle,
            { textDecorationLine: 'underline' },
          ]}
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
      // Text trong ngoặc vuông [text] - làm mờ (opacity thấp hơn vì dòng đã có opacity 0.7)
      parts.push(
        <Text
          key={`bracket-${key++}`}
          style={[style, textStyle, { opacity: 0.5 }]}
        >
          [{match.content}]
        </Text>,
      );
    }

    currentIndex = match.end;
  }

  if (currentIndex < children.length) {
    const textAfter = children.substring(currentIndex);
    if (textAfter) {
      parts.push(
        <Text key={`text-${key++}`} style={[style, textStyle]}>
          {textAfter}
        </Text>,
      );
    }
  }

  if (parts.length === 0) {
    return <Text style={[style, textStyle]}>{children}</Text>;
  }

  return <Text style={style}>{parts}</Text>;
};
