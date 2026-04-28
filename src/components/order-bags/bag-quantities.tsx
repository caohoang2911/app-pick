import AntDesign from '@expo/vector-icons/AntDesign';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useSetOrderBagQuantities } from '~/src/api/app-pick/use-set-order-bag-quantities';
import { Input } from '~/src/components/Input';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { OrderBagWeightType } from '~/src/types/config';

const BagQuantityRow = ({
  bagType,
  quantity,
  originalQuantity,
  onQuantityChange,
  onSave,
}: {
  bagType: OrderBagWeightType;
  quantity: number;
  originalQuantity: number;
  onQuantityChange: (id: string, value: number) => void;
  onSave: () => void;
}) => {
  const hasChanged = quantity !== originalQuantity;
  const isDecrementDisabled = quantity <= 0;

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(bagType.id, quantity - 1);
    }
  };

  const handleIncrement = () => {
    onQuantityChange(bagType.id, quantity + 1);
  };

  const handleTextChange = (text: string) => {
    const parsed = parseInt(text, 10);
    onQuantityChange(bagType.id, isNaN(parsed) ? 0 : Math.max(0, parsed));
  };

  return (
    <View className="py-2 px-4 flex-row items-center gap-3">
      <Text className="text-base font-semibold w-20">{bagType.name}</Text>
      <Input
        className="flex-1"
        keyboardType="number-pad"
        value={String(quantity)}
        onChangeText={handleTextChange}
        inputClasses="text-center"
        prefix={
          <TouchableOpacity
            disabled={isDecrementDisabled}
            onPress={handleDecrement}
            className="rounded-md bg-gray-200 items-center justify-center -ml-2"
            style={{
              width: 38,
              height: 38,
              opacity: isDecrementDisabled ? 0.5 : 1,
            }}
          >
            <Text className="text-2xl text-blue-500">-</Text>
          </TouchableOpacity>
        }
        suffix={
          <TouchableOpacity
            onPress={handleIncrement}
            className="rounded-md bg-gray-200 items-center justify-center -mr-2"
            style={{ width: 38, height: 38 }}
          >
            <Text className="text-2xl text-blue-500">+</Text>
          </TouchableOpacity>
        }
      />
      <TouchableOpacity
        onPress={onSave}
        disabled={!hasChanged}
        style={{ opacity: hasChanged ? 1 : 0.4 }}
        className="flex-row items-center gap-1 w-16 justify-end"
      >
        <AntDesign
          name="checkcircleo"
          size={16}
          color={hasChanged ? '#3280F6' : '#9CA3AF'}
        />
        <Text
          className={`text-base font-semibold ${hasChanged ? 'text-colorPrimary' : 'text-gray-400'}`}
        >
          Lưu
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const BagQuantities = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const config = useConfig.use.config();
  const { orderDetail } = useOrderDetailForCode(code);
  const bagWeightTypes = config?.orderBagWeightTypes;

  const serverQuantities = useMemo(
    () => orderDetail?.header?.bagQuantities ?? {},
    [orderDetail?.header?.bagQuantities],
  );

  const [localQuantities, setLocalQuantities] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (serverQuantities) {
      setLocalQuantities(serverQuantities);
    }
  }, [serverQuantities]);

  const { mutate: submitBagQuantities } = useSetOrderBagQuantities((error) => {
    if (error) {
      setLoading(false);
      setLocalQuantities(serverQuantities);
      showMessage({
        message: `Lỗi cập nhật số túi: ${error}`,
        type: 'danger',
        duration: 4000,
      });
    }
  });

  const handleQuantityChange = useCallback((id: string, value: number) => {
    setLocalQuantities((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSave = useCallback(() => {
    if (!code) return;

    const payload: Record<string, number> = {};
    bagWeightTypes?.forEach((t) => {
      payload[t.id] = localQuantities[t.id] ?? 0;
    });

    setLoading(true);
    submitBagQuantities({
      orderCode: code,
      bagQuantities: payload,
    });
  }, [code, bagWeightTypes, localQuantities, submitBagQuantities]);

  if (!bagWeightTypes?.length) return null;

  return (
    <View className="bg-white mx-4 pt-3 pb-2 rounded-md">
      <Text className="text-base font-semibold mb-2 px-4">Nhập túi hàng</Text>
      <View className="px-0">
        {bagWeightTypes.map((bagType) => (
          <BagQuantityRow
            key={bagType.id}
            bagType={bagType}
            quantity={localQuantities[bagType.id] ?? 0}
            originalQuantity={serverQuantities[bagType.id] ?? 0}
            onQuantityChange={handleQuantityChange}
            onSave={handleSave}
          />
        ))}
      </View>
    </View>
  );
};

export default BagQuantities;
