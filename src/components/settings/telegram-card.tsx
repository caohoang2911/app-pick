import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors } from '~/src/ui/colors';
import { Button } from '../Button';
import SettingsCard from './settings-card';

// Card Telegram: mở bot lấy Telegram user id; badge hiển thị teleId
// từ userInfo nếu đã có.
const TelegramCard = ({
  badgeText = 'Chưa có telegram ID',
  onOpen,
  onOpenGuide,
}: {
  badgeText?: string | null;
  onOpen: () => void;
  onOpenGuide?: () => void;
}) => {
  return (
    <SettingsCard>
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Ionicons
            name="paper-plane-outline"
            size={24}
            color={colors.blue[600]}
          />
        </View>
        <Text className="flex-1 text-base font-bold text-gray-900">
          Telegram
        </Text>
        {!!badgeText && (
          <View className="rounded-full bg-green-50 px-2.5 py-1">
            <Text className="text-xs font-semibold text-green-600">
              {badgeText}
            </Text>
          </View>
        )}
      </View>
      <View className="mt-3 flex-row items-center justify-between gap-3">
        {onOpenGuide ? (
          <TouchableOpacity
            onPress={onOpenGuide}
            hitSlop={8}
            className="flex-shrink flex-row items-center gap-1"
          >
            <Ionicons
              name="help-circle-outline"
              size={16}
              color={colors.blue[600]}
            />
            <Text
              numberOfLines={1}
              className="text-sm font-medium text-blue-600"
            >
              Hướng dẫn lấy Telegram ID
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <Button
          variant="secondary"
          className="rounded-lg border-blue-500 px-4"
          labelClasses="text-sm font-semibold text-blue-600"
          icon={
            <Ionicons
              name="paper-plane-outline"
              size={15}
              color={colors.blue[600]}
            />
          }
          label="Mở Telegram"
          onPress={onOpen}
        />
      </View>
    </SettingsCard>
  );
};

export default TelegramCard;
