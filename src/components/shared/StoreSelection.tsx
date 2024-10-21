import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { stringUtils } from '~/src/core/utils/string';
import { Option } from '~/src/types/commons';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import Empty from './Empty';
import SearchLine from '~/src/core/svgs/SearchLine';
import { CheckCircleFill } from '~/src/core/svgs';

type Props = {
  onSelect: (store: Option & { address: string }) => void;
  selectedId: string;
};

const StoreSelection = forwardRef<any, Props>(
  ({ onSelect, selectedId }, ref) => {
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState('');

    const actionRef = useRef<any>();
    const { stores } = useConfig.use.config();

    const filteredStores = useMemo(() => {
      return stores?.sort((a: any, b: any) => {
        if (a.id === selectedId) return -1;
        if (b.id === selectedId) return 1;
        return 0;
      }).filter((store: Option & { address: string }) => {
        if (!search) return true;
        const byStoreName = stringUtils.removeAccents(store.name?.toLowerCase()).includes(stringUtils.removeAccents(search.toLowerCase()));
        const byAddress = store.address?.toLowerCase().includes(search.toLowerCase());

        return byStoreName || byAddress;
      });
    }, [stores, search, selectedId]);

    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => {
            actionRef.current?.present();
            setVisible(!visible);
          },
          close: () => {
            actionRef.current?.close();
            setVisible(false);
          },
        };
      },
      []
    );

    return (
      <>
        <SBottomSheet
          visible={visible}
          title="Chọn cửa hàng"
          ref={actionRef}
          snapPoints={[600, "70%"]}
          onClose={() => setVisible(false)}
        >
          <View className="px-4 pt-3">
            <Input
              className="flex-grow"
              placeholder="Tìm kiếm"
              prefix={<SearchLine width={20} height={20} />}
              onChangeText={(value: string) => {
                setSearch(value);
              }}
              useBottomSheetTextInput
              value={search}
              allowClear
              onClear={() => {
                setSearch('');
              }}
            />
          </View>
          {Boolean(!filteredStores?.length) && <Empty />}
          {Boolean(filteredStores?.length) && <>
            <View>
              {filteredStores?.map((store: any, index: number) => (
                <TouchableOpacity 
                  disabled={selectedId === store.id}
                  key={index} 
                  onPress={() => {
                    if(selectedId === store.id) return;
                    setVisible(false);
                    onSelect?.(store);
                }}>
                  <View className="p-4 border-b border-gray-200">
                    <View className="flex flex-row items-center gap-1">
                      {selectedId === store.id && <CheckCircleFill width={15} height={15} color={"green"} />}
                      <Text className="text-lg font-semibold">{store.name}</Text>
                    </View>
                    <Text className="text-sm text-gray-600">{store.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            </>
          }
        </SBottomSheet>
      </>
    )
  })

  export default StoreSelection;
