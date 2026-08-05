import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { cn } from '~/src/lib/utils';

// Card trắng bo góc + đổ bóng dùng chung cho màn hình Cài đặt.
const SettingsCard = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <View className={cn('mx-4 bg-white p-4', className)} style={styles.box}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        shadowColor: '#222',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 5.46,
        elevation: 2,
      },
    }),
  },
});

export default SettingsCard;
