import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { formatNotificationRelativeTime } from '~/src/core/utils/app-notification';
import type { AppNotification } from '~/src/types/notification';

const TICKET_ICON_COLOR = '#3b82f6';
const INFO_ICON_COLOR = '#111827';

const NotificationTypeIcon = ({
  type,
  isSeen,
}: {
  type: AppNotification['type'];
  isSeen: boolean;
}) => {
  const ticketColor = isSeen ? '#93c5fd' : TICKET_ICON_COLOR;
  const infoColor = isSeen ? '#9ca3af' : INFO_ICON_COLOR;

  switch (type) {
    case 'TICKET':
      return (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={22}
          color={ticketColor}
        />
      );
    case 'INFO':
      return (
        <Ionicons name="notifications-outline" size={22} color={infoColor} />
      );
    default:
      return (
        <Ionicons name="notifications-outline" size={22} color={infoColor} />
      );
  }
};

const NotificationItem = ({
  title,
  content,
  createdTime,
  type,
  isSeen,
}: AppNotification) => {
  const timeLabel = formatNotificationRelativeTime(createdTime);

  return (
    <View
      className="px-4 py-3 border-b border-gray-200 bg-white"
      style={{ opacity: isSeen ? 0.72 : 1 }}
    >
      <View className="flex-row items-start gap-3">
        <View className="pt-0.5">
          <NotificationTypeIcon type={type} isSeen={isSeen} />
        </View>
        <View className="flex-1 min-w-0 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className={`flex-1 text-base font-semibold ${
                isSeen ? 'text-gray-500' : 'text-gray-900'
              }`}
              numberOfLines={2}
            >
              {title}
            </Text>
            {!!timeLabel && (
              <Text
                className={`text-xs shrink-0 pt-0.5 ${
                  isSeen ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {timeLabel}
              </Text>
            )}
          </View>
          <Text
            className={`text-sm ${isSeen ? 'text-gray-400' : 'text-gray-700'}`}
            numberOfLines={3}
          >
            {content}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default memo(NotificationItem);
