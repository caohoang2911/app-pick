import React, { memo, useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ActionMenuItem } from '~/src/core/store/employee-manage';
import SBottomSheet from '../SBottomSheet';

interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  actions: ActionMenuItem[];
  title?: string;
}

const ActionMenu = memo(({ 
  visible, 
  onClose, 
  actions, 
  title = "Thao tác" 
}: ActionMenuProps) => {
  const actionRef = useRef<any>();
  
  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);
  
  return (
    <SBottomSheet
      ref={actionRef}
      visible={visible}
      title={title}
      onClose={onClose}
      snapPoints={[300, 400]}
      keyboardBehavior="interactive"
    >
      <View className="px-4">
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => {
              if (!action.disabled) {
                action.onPress();
                onClose();
              }
            }}
            disabled={action.disabled}
            className={`flex-row items-center py-4 border-b border-gray-100 ${
              action.disabled ? 'opacity-50' : ''
            }`}
          >
            <View className="mr-3">
              {action.icon}
            </View>
            <Text className={`text-base ${
              action.destructive ? 'text-red-600' : 'text-gray-900'
            } ${action.disabled ? 'text-gray-400' : ''}`}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SBottomSheet>
  );
});

ActionMenu.displayName = 'ActionMenu';

export default ActionMenu; 