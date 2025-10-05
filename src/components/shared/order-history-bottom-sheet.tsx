import React, { forwardRef, useEffect, useRef } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SBottomSheet from '../SBottomSheet';
import { useOrderPick } from '@/core/store/order-pick';
import moment from 'moment';

interface OrderHistoryBottomSheetProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  orderCode: string;
}

export interface OrderHistoryBottomSheetRef {
  present: () => void;
}

const OrderHistoryBottomSheet = forwardRef<
  OrderHistoryBottomSheetRef,
  OrderHistoryBottomSheetProps
>(({ visible, setVisible }, ref) => {
  const actionRef = useRef<any>();

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  const orderDetail = useOrderPick.use.orderDetail();
  const deliveryLogs = orderDetail?.delivery?.logs || [];

  const renderHistoryItem = (item: {
    activity: string;
    activityName: string;
    time: number;
    user: {
      company: string;
      email: string;
      name: string;
      phone: string;
    };
    notes: Array<string>;
  }, index: number, isLast: boolean) => {
    const userName = item.user?.name;
    const userRole = item.user?.company;
    // Use notes array directly from LogOrder
    const detailLines = item.notes || [];
    
    return (
      <View key={index} className="flex-row items-start">
        {/* Timeline container with better positioning */}
        <View className="relative w-6 mr-2">
          {/* Vertical line connector (except for last item) */}
          {!isLast && (
            <View className="absolute w-0.5 bg-gray-100" style={{ left: 5, top: 8, height: '100%' }} />
          )}
          {/* Blue timeline dot - align with first line of content */}
          <View className="absolute left-0 w-3 h-3 bg-blue-500 rounded-full z-10" style={{ top: 6 }} />
        </View>
        
        <View className="flex-1 pb-6">
          {/* Action and timestamp on same line */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-base font-semibold text-gray-900 flex-1">
              {item.activityName}
            </Text>
            {item.time && (
              <Text className="text-xs text-gray-400 ml-2">
                {moment(item.time).format('DD/MM/YYYY HH:mm')}
              </Text>
            )}
          </View>
          
          {/* User info with better styling */}
          {userName && (
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="person" size={16} color="#6B7280" style={{ marginRight: 4 }} />
              <Text className="text-sm text-gray-600">
                {userName}
              </Text>
              {userRole && (
                <View className="ml-2 px-2 py-0.5 bg-blue-100 rounded-full">
                  <Text className="text-xs text-blue-700 font-medium">
                    {userRole}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Details as bullet points */}
          {detailLines.length > 0 && (
            <View className="mt-1">
              {detailLines.map((line: string, lineIndex: number) => (
                <View key={lineIndex} className="flex-row items-start mb-0.5">
                  <View className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2" />
                  <Text className="flex-1 text-sm text-gray-500">
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SBottomSheet
      ref={actionRef}
      visible={visible}
      onClose={() => setVisible(false)}
      title="Lịch sử đơn hàng"
      snapPoints={[500, '80%']}
    >
      <View className="p-4 flex-1">
        <ScrollView className="flex-1">
          {deliveryLogs.length > 0 ? (
            deliveryLogs.map((item, index) => renderHistoryItem(item,  index, index === deliveryLogs.length - 1))
          ) : (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-gray-500 text-center">
                Chưa có lịch sử đơn hàng
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SBottomSheet>
  );
});

export default OrderHistoryBottomSheet;
