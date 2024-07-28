import { signOut } from '@/core';
import { TouchableOpacity } from '@gorhom/bottom-sheet';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { FlatList, RefreshControl } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import { Input } from '~/src/components/Input';
import Motobike from '~/src/components/svgs/Motobike';
import { Badge } from '~/src/components/Badge';
import clsx from 'clsx';

const data = [
  { id: 1, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 2,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 3, title: 'title 3', details: 'details 3 details 3' },
  { id: 4, title: 'title 4 title 4', details: 'details 4' },
  { id: 1, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 2,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 3, title: 'title 3', details: 'details 3 details 3' },
  { id: 4, title: 'title 4 title 4', details: 'details 4' },
  { id: 1, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 2,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 3, title: 'title 3', details: 'details 3 details 3' },
  { id: 4, title: 'title 4 title 4', details: 'details 4' },
  { id: 1, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 2,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 3, title: 'title 3', details: 'details 3 details 3' },
  { id: 4, title: 'title 4 title 4', details: 'details 4' },
  { id: 1, title: 'title 1', details: 'details 1 details 1 details 1' },
  {
    id: 2,
    title: 'title 2',
    details: 'details 2 details 2 details 2 details 2 details 2 details 2',
  },
  { id: 3, title: 'title 3', details: 'details 3 details 3' },
  { id: 4, title: 'title 4 title 4', details: 'details 4' },
];

const dataStatus = [
  {
    id: 'all',
    label: 'Tất cả (25)',
  },
  {
    id: 'confirm',
    label: 'Đã xác nhận (10)',
  },
  {
    id: 'pick',
    label: 'Đang pick (2)',
  },
  {
    id: 'picked',
    label: 'Đã Pick (0)',
  },
  {
    id: 'packing',
    label: 'Đang soạn hàng (5)',
  },
  {
    id: 'shipping',
    label: 'Đang vận chuyển (30)',
  },
  {
    id: 'complete',
    label: 'Đã hoàn thành (10)',
  },
];

export function TabsStatus({ statusSeleted = 'shipping', onPressItem }: any) {
  const ref = useRef<any>();

  useEffect(() => {
    const index = dataStatus.findIndex(
      (status) => status.id === (statusSeleted as any)
    );

    setTimeout(() => {
      ref.current.scrollToIndex({
        animated: true,
        index,
        viewPosition: 0.5,
      });
    }, 100);
  }, [statusSeleted]);

  return (
    <FlatList
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      data={dataStatus}
      renderItem={({ item, index }: { item: any; index: number }) => {
        const isStatusSeleted = item.id === statusSeleted;
        const isFirst = index === 0;
        const isLast = index === dataStatus?.length - 1;

        return (
          <TouchableOpacity
            key={item.id}
            className={clsx('py-1 rounded', {
              'pr-4': isFirst,
              'px-3': !isFirst,
              'px-0 pl-3': isLast,
            })}
            onPress={() => onPressItem(item.id)}
          >
            <Text
              className={clsx({
                'color-colorPrimary font-semibold': isStatusSeleted,
                'color-gray-500': !isStatusSeleted,
              })}
            >
              {item.label}
            </Text>
            {isStatusSeleted && (
              <View
                style={{ height: 2, marginTop: 5 }}
                className={clsx({
                  'rounded-t-md bg-colorPrimary': isStatusSeleted,
                })}
              />
            )}
          </TouchableOpacity>
        );
      }}
      horizontal
    />
  );
}

const ItemProduct = () => {
  return (
    <View className="rounded-md border-bgPrimary border">
      <View className="bg-bgPrimary p-4 flex flex-row justify-between items-center">
        <View className="flex flex-row gap-2 items-center">
          <Motobike />
          <Text className="font-semibold text-base text-colorPrimary">
            Mã đơn OL100100
          </Text>
        </View>
        <Badge label={'Đang xác nhận'} variant={'default'} />
      </View>
      <View className="p-4 pt-2 gap-1">
        <Text className="font-semibold">Khách hàng: Minh Nguyễn</Text>
        <Text>
          Ngày tạo: <Text className="font-semibold">12/07/2024 10:00</Text>
        </Text>
        <Text>
          Ngày giao hàng:
          <Text className="font-semibold">12/07/2024 14:00</Text>
        </Text>
      </View>
    </View>
  );
};

const FixedHeader = () => {
  const [statusSeleted, setStatusSelected] = useState('all');

  const handlePressItem = useCallback((status: any) => {
    setStatusSelected(status);
  }, []);

  return (
    <>
      <View className="flex flex-row mt-3 justify-between items-center">
        <Text className="font-heading text-xl">Danh sách đơn hàng</Text>
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        </Avatar>
      </View>
      <View className="flex flex-row mt-4 justify-between items-center gap-3">
        <Input className="flex-grow" placeholder="Mã đơn hàng, sản phẩm" />
        <TouchableOpacity className=" bg-colorPrimary rounded-md size-10 flex flex-row justify-center items-center">
          <FontAwesome name="qrcode" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View className="mt-6">
        <TabsStatus
          onPressItem={handlePressItem}
          statusSeleted={statusSeleted}
        />
      </View>
    </>
  );
};

const Index = () => {
  const router = useRouter();
  const onSubmit = () => {
    signOut();
    router.push('/login');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 bg-white text-xl px-4">
        <View>
          <FixedHeader />
        </View>
        <View className="mt-4 flex-grow">
          <FlatList
            className="flex-1"
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={false} onRefresh={() => {}} />
            }
            data={data}
            renderItem={({ item }: { item: any }) => (
              <View key={item.title} className="my-3">
                <ItemProduct />
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Index;
