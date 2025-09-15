import { Ionicons, Octicons } from '@expo/vector-icons';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { Option } from '~/src/types/commons';
import SBottomSheet from '../SBottomSheet';

interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
}

interface ServingStoresModalProps {
  driverAssignedStoreCodes: string[];
}

export interface ServingStoresModalRef {
  present: () => void;
}

const AssignStoreBottomSheet = forwardRef<ServingStoresModalRef, ServingStoresModalProps>(
    ({ driverAssignedStoreCodes }, ref) => {
    const [visible, setVisible] = useState(false);
    const actionRef = useRef<any>();
    const config = useConfig.use.config();
    const storesConfig = config?.stores || [];

    const stores = storesConfig.filter((store: Option) => driverAssignedStoreCodes.includes(store.id as string)) as Store[];
  
    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => {
            setVisible(!visible);
          },
        };
      },
      []
    );
  
    useEffect(() => {
      if (visible) {
        actionRef.current?.present();
      }
    }, [visible]);

    const handleStorePress = (store: Store) => {
      console.log('store', store);
    };

    const handleClose = () => {
      setVisible(false);
    };

    const StoreItem = ({ store }: { store: Store }) => (
      <Pressable
        onPress={() => handleStorePress(store)}
        className="flex flex-row items-center gap-3 py-4 border-b border-gray-100"
      >
        <View className="w-8 h-8 items-center justify-center">
          <Octicons name="home" size={18} color="gray" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-medium text-gray-800 mb-1">
            {store.name}
          </Text>
          <Text className="text-sm text-gray-500">
            {store.address}
          </Text>
        </View>
      </Pressable>
    );

    return (
      <SBottomSheet
        ref={actionRef}
        visible={visible}
        onClose={handleClose}
        title="Cửa hàng phục vụ đơn"
        snapPoints={[400, '70%']}
      >
        <ScrollView className="px-4 pb-4" showsVerticalScrollIndicator={false}>
          {stores.length > 0 ? (
            stores.map((store, index) => (
              <StoreItem key={store.id || index} store={store} />
            ))
          ) : (
            <View className="py-8 items-center">
              <Ionicons name="storefront-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-base mt-2">
                Không có cửa hàng nào
              </Text>
            </View>
          )}
        </ScrollView>
      </SBottomSheet>
    );
  }
);

export default AssignStoreBottomSheet;

