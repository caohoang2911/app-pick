import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-pick';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import { MarkdownText } from '~/src/core/utils/markdown';

const FulfillErrors = () => {
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { fulfillError } = header || {};

  const config = useConfig.use.config();
  const fulfillErrorTypes = config?.fulfillErrorTypes || [];
  const fulfillErrorTypeDisplay = getConfigNameById(
    fulfillErrorTypes,
    fulfillError?.type,
  );

  if (!fulfillError?.type) return null;

  const messages = fulfillError.messages || [];

  return (
    <View className="mx-4 px-3 mb-3 py-2 rounded flex bg-red-400">
      {fulfillErrorTypeDisplay && (
        <View className="flex flex-row items-center mb-1">
          <View className="flex-1">
            <MarkdownText
              textStyle={{
                fontSize: 12,
                fontWeight: '600',
                color: 'white',
                lineHeight: 16,
              }}
              linkStyle={{ color: '#93c5fd', fontSize: 12 }}
            >
              {fulfillErrorTypeDisplay}
            </MarkdownText>
          </View>
        </View>
      )}
      {messages.length > 0 && (
        <>
          {messages.map((message: string, index: number) => {
            // Split message thành các dòng và xử lý từng dòng
            const lines = message.split(/\n+/).filter((line) => line.trim());

            return (
              <React.Fragment key={index}>
                {lines.map((line, lineIndex) => {
                  const trimmedLine = line.trim();

                  // Parse heading (chỉ ###, không coi dòng đầu tiên là heading nữa)
                  const headingMatch = trimmedLine.match(/^###\s+(.+)$/);
                  const headingText = headingMatch ? headingMatch[1] : null;
                  const isHeading = !!headingText;

                  // Parse bullet item (•) - kiểm tra TRƯỚC để tránh match nhầm
                  const bulletMatch = trimmedLine.match(/^[•·]\s*(.+)$/); // Hỗ trợ cả • và ·
                  const bulletText = bulletMatch ? bulletMatch[1] : null;

                  // Parse subitem bắt đầu bằng dấu +
                  const plusMatch = trimmedLine.match(/^\+\s*(.+)$/);
                  const plusText = plusMatch ? plusMatch[1] : null;

                  // Parse nested item với dash (– hoặc —) - chỉ match nếu BẮT ĐẦU bằng dash, không phải khoảng trắng
                  const nestedDashMatch =
                    !bulletText &&
                    !plusText &&
                    (trimmedLine.startsWith('–') || trimmedLine.startsWith('—'))
                      ? trimmedLine.match(/^(–|—)(.+)$/)
                      : null;
                  const nestedDashText = nestedDashMatch
                    ? nestedDashMatch[2]
                    : null;

                  // Kiểm tra nếu text đã có bullet ở đầu (các ký tự bullet khác nhau)
                  const hasBulletInText = /^[•·▪▫◦‣⁃]\s*/.test(trimmedLine);

                  if (isHeading && headingText) {
                    // Heading với ###
                    return (
                      <View
                        key={`${index}-${lineIndex}`}
                        className="flex flex-row mt-1 mb-0.5"
                      >
                        <View className="flex-1 flex-row items-center">
                          <View className="size-1 bg-white rounded-full mr-2" />
                          <MarkdownText
                            textStyle={{
                              fontSize: 11,
                              fontWeight: '700',
                              color: 'white',
                              lineHeight: 14,
                            }}
                            linkStyle={{ color: '#93c5fd', fontSize: 11 }}
                          >
                            {headingText}
                          </MarkdownText>
                        </View>
                      </View>
                    );
                  }

                  if (plusText) {
                    // Thay tất cả dấu + thành dấu - trong text
                    const textWithDash = plusText.replace(/\+/g, '-');
                    return (
                      <View
                        key={`${index}-${lineIndex}`}
                        className="flex flex-row"
                        style={{ opacity: 0.8, paddingLeft: 0 }}
                      >
                        <Text
                          className="text-white mr-2"
                          style={{ fontSize: 11, lineHeight: 16 }}
                        >
                          –
                        </Text>
                        <View className="flex-1">
                          <MarkdownText
                            textStyle={{
                              fontSize: 12,
                              fontWeight: '500',
                              color: 'white',
                              lineHeight: 16,
                            }}
                            linkStyle={{ color: '#93c5fd', fontSize: 12 }}
                          >
                            {textWithDash}
                          </MarkdownText>
                        </View>
                      </View>
                    );
                  }

                  if (nestedDashText) {
                    // Nested item với dash (indent nhiều hơn) - làm mờ cả dòng
                    return (
                      <View
                        key={`${index}-${lineIndex}`}
                        className="flex flex-row"
                        style={{ opacity: 0.7, paddingLeft: 16 }}
                      >
                        <Text
                          className="text-white mr-2"
                          style={{ fontSize: 11, lineHeight: 16 }}
                        >
                          –
                        </Text>
                        <View className="flex-1">
                          <MarkdownText
                            textStyle={{
                              fontSize: 12,
                              fontWeight: '500',
                              color: 'white',
                              lineHeight: 16,
                            }}
                            linkStyle={{ color: '#93c5fd', fontSize: 12 }}
                          >
                            {nestedDashText}
                          </MarkdownText>
                        </View>
                      </View>
                    );
                  }

                  if (bulletText) {
                    // Bullet item (•) - text đã có bullet trong nguồn, chỉ hiển thị text không có bullet
                    return (
                      <View
                        key={`${index}-${lineIndex}`}
                        className="flex flex-row"
                      >
                        <Text
                          className="text-white mr-2"
                          style={{ fontSize: 10, lineHeight: 16 }}
                        >
                          •
                        </Text>
                        <View className="flex-1">
                          <MarkdownText
                            textStyle={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: 'white',
                              lineHeight: 16,
                            }}
                            linkStyle={{ color: '#93c5fd', fontSize: 12 }}
                          >
                            {bulletText}
                          </MarkdownText>
                        </View>
                      </View>
                    );
                  }

                  // Default: parent item - LUÔN có bullet
                  // Loại bỏ bullet nếu đã có trong text để tránh duplicate
                  const textWithoutBullet = hasBulletInText
                    ? trimmedLine.replace(/^[•·▪▫◦‣⁃]\s*/, '')
                    : trimmedLine;

                  // Đảm bảo luôn render với bullet
                  return (
                    <View
                      key={`${index}-${lineIndex}`}
                      className="flex flex-row"
                    >
                      <Text
                        className="text-white mr-2"
                        style={{ fontSize: 10, lineHeight: 16 }}
                      >
                        •
                      </Text>
                      <View className="flex-1">
                        <MarkdownText
                          textStyle={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: 'white',
                            lineHeight: 16,
                          }}
                          linkStyle={{ color: '#93c5fd', fontSize: 12 }}
                        >
                          {textWithoutBullet || trimmedLine}
                        </MarkdownText>
                      </View>
                    </View>
                  );
                })}
              </React.Fragment>
            );
          })}
        </>
      )}
    </View>
  );
};

export default memo(FulfillErrors);
