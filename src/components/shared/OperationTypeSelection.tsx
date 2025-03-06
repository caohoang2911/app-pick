import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { CheckCircleFill } from '~/src/core/svgs';
import { Option } from '~/src/types/commons';
import SBottomSheet from '../SBottomSheet';
import { stringUtils } from '~/src/core/utils/string';


type Props = {
  onSelect: (operationType: Option & { address: string }) => void;
  selectedId: string;
};

const OperationTypeSelection = forwardRef<any, Props>(
  ({ onSelect, selectedId }, ref) => {
    const [visible, setVisible] = useState(false);

    const actionRef = useRef<any>();
    const { orderOperationTypes } = useConfig.use.config();

    useImperativeHandle(
      ref,
      () => {
        return {
          present: () => {
            actionRef.current?.present();
            setVisible(true);
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
          title="Operation type"
          ref={actionRef}
          titleAlign="center"
          snapPoints={[270]}
          onClose={() => setVisible(false)}
        >
          <View>
            {[{id: "", name: "Tất cả"}, ...orderOperationTypes]?.map((operationType: any, index: number) => (
              <TouchableOpacity 
                disabled={selectedId === operationType.id}
                key={index} 
                onPress={() => {
                  if(selectedId === operationType.id) return;
                  setVisible(false);
                  onSelect?.(operationType);
              }}>
                <View className="p-4 border-b border-gray-200">
                  <View className="flex flex-row items-center gap-1 justify-between">
                    <Text className="text-lg font-semibold">{stringUtils.uppercaseFirstCharacter(operationType.name)}</Text>
                    {Boolean(String(selectedId) == String(operationType.id)) && <CheckCircleFill width={20} height={20} color={"green"} />}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </SBottomSheet>
      </>
    )
  })

  export default React.memo(OperationTypeSelection);
