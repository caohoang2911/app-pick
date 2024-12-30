import { Picker } from '@react-native-picker/picker';
import React, { useState } from "react";
import { Text, View } from "react-native";
import { getProductComboRemoveSelected, toggleConfirmationRemoveProductCombo, useOrderPick } from "~/src/core/store/order-pick";
import SBottomSheet from "../SBottomSheet";
import SDropdown from '../SDropdown';
import { Button } from '../Button';
import { useRemoveProductItem } from '~/src/api/app-pick/use-remove-product-item';
import { queryClient } from '~/src/api/shared';
import { useLocalSearchParams } from 'expo-router';
import { setLoading } from '~/src/core/store/loading';
import { showMessage } from 'react-native-flash-message';

export function ProductComboConfirmation() {
  const isShowConfirmationRemoveProductCombo = useOrderPick.use.isShowConfirmationRemoveProductCombo();
  const productComboRemoveSelected = getProductComboRemoveSelected();

  const { code } = useLocalSearchParams();
  
  const [reason, setReason] = useState('');

  const { mutate: removeProductItem } = useRemoveProductItem(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
  });

  const handleConfirmRemoveProductCombo = () => {
    if(reason === '') {
      showMessage({
        message: 'Vui lòng chọn lý do',
        type: 'danger',
      });
      return;
    }
    setLoading(true);
    removeProductItem({ itemId: productComboRemoveSelected?.pId, reason: reason, orderCode: code as string });
    toggleConfirmationRemoveProductCombo(false);
  };

  return (
    <SBottomSheet
      title={"Remove sản phẩm combo"}
      visible={isShowConfirmationRemoveProductCombo}
      onClose={() => {
        toggleConfirmationRemoveProductCombo(false);
      }}
    > 
      <View className="gap-3 p-3 mb-6">
        <Text className="text-sm mb-4 text-gray-700">Sản phẩm {productComboRemoveSelected?.name} thuộc về 1 combo, nếu xoá sản phẩm này thì combo sẽ bị xoá</Text>
        <SDropdown
          data={[{name: 'Hết hàng', id: 'Hết hàng'}, {name: 'Không còn sử dụng', id: 'Không còn sử dụng'}, {name: 'Khác', id: 'Khác'}]}
          label="Chọn lý do"
          labelClasses="font-medium"
          dropdownPosition="top"
          placeholder="Vui lòng chọn"
          value={reason}
          allowClear={true}
          useBottomSheetTextInput
          onSelect={(value: string) => {
            setReason(value);
          }}
          onClear={() => {
            setReason('');
          }}
        />
        <Button
          className="mt-3"
          label="Xác nhận"
          onPress={handleConfirmRemoveProductCombo}  
        />
      </View>
    </SBottomSheet>
  );
}