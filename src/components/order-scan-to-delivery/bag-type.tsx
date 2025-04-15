import { useLocalSearchParams } from 'expo-router';
import React, { memo, useMemo } from 'react';
import { Text, View, FlatList } from 'react-native';
import { OrderBagItem, OrderBagType } from '~/src/types/order-bag';
import BagItem from './bag-item';

// Tách header thành component riêng và memoize
const BagTypeHeader = memo(({ title, count }: { title: string; count: number }) => (
  <View className="flex-row justify-between items-center bg-blue-50 p-3 rounded-t-md">
    <Text className="text-base font-semibold">{title}</Text>
    <Text className="text-base text-gray-500">SL: {count}</Text>
  </View>
));

// Memoize BagItem để tránh re-render không cần thiết
const MemoizedBagItem = memo(BagItem);

// Item renderer được tối ưu với memo và key duy nhất
const renderBagItem = ({ item }: { item: OrderBagItem }) => (
  <MemoizedBagItem
    key={item?.code}
    code={item?.code}
    lastScannedTime={item?.lastScannedTime}
    isDone={item?.isDone || false}
  />
);

// Tách keyExtractor để tránh tạo function mới mỗi lần render
const keyExtractor = (item: OrderBagItem) => item.code;

// Item separator cho FlatList
const ItemSeparator = memo(() => <View className="h-2" />);

const BagType = memo(({
  title,
  bagLabels,
  type,
}: {
  title: string;
  bagLabels: OrderBagItem[];
  type: OrderBagType;
}) => {
  // Early return với dữ liệu rỗng
  if (bagLabels.length === 0) return null;

  // Memoize danh sách bags để tránh rerender không cần thiết
  const bags = useMemo(() => bagLabels, [bagLabels]);

  return (
    <View className="bg-white rounded-md overflow-hidden">
      <View className="flex flex-col">
        <BagTypeHeader title={title} count={bags.length} />
        
        <View className="p-2 border-blue-50">
          <FlatList
            data={bags}
            renderItem={renderBagItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={ItemSeparator}
            removeClippedSubviews={true} // Giải phóng bộ nhớ cho items không hiển thị
            initialNumToRender={8} // Giảm số lượng items render ban đầu
            maxToRenderPerBatch={5} // Render ít items mỗi batch
            windowSize={5} // Giảm kích thước window
            updateCellsBatchingPeriod={50} // Thời gian batching
            getItemLayout={(data, index) => (
              // Tối ưu hóa scrolling bằng cách xác định trước kích thước item
              { length: 50, offset: 52 * index, index }
            )}
            scrollEnabled={false} // Tắt scroll của list con vì đã có scroll ở component cha
            contentContainerStyle={{ gap: 8 }} // Khoảng cách giữa các items
          />
        </View>
      </View>
    </View>
  );
});

// Đặt displayName để dễ debug
BagType.displayName = 'BagType';

export default BagType;