import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { stringUtils } from '~/src/core/utils/string';

type Props = {
  storeName: string;
  storeCode: string;
  employeeName: string;
  employeeCode: string;
};

const AddEmployeeConfirmContent = ({
  storeName,
  storeCode,
  employeeName,
  employeeCode,
}: Props) => {
  const showStoreCode = storeName !== storeCode;

  return (
    <View className="w-full items-center pt-1">
      {/* Nhân viên */}
      <View className="h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-blue-50">
        <Text className="text-base font-bold text-blue-600">
          {stringUtils.getInitials(employeeName || employeeCode)}
        </Text>
      </View>
      <Text className="mt-2.5 text-center text-base font-semibold text-gray-900">
        {employeeName}
      </Text>
      <View className="mt-1.5 rounded-full bg-gray-100 px-3 py-1">
        <Text className="text-xs font-semibold tracking-wide text-gray-600">
          {employeeCode.toUpperCase()}
        </Text>
      </View>

      {/* Mũi tên nối: nhân viên → siêu thị */}
      <View className="my-2 items-center">
        <View className="h-2 w-px bg-gray-200" />
        <View className="h-7 w-7 items-center justify-center rounded-full bg-blue-50">
          <Ionicons name="arrow-down" size={15} color="#2563EB" />
        </View>
        <View className="h-2 w-px bg-gray-200" />
      </View>

      {/* Siêu thị */}
      <View className="w-full flex-row items-center gap-3 rounded-xl border border-blue-200/60 bg-blue-50 px-3.5 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-white">
          <Ionicons name="storefront" size={20} color="#2563EB" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xs font-medium text-blue-600">Siêu thị</Text>
          <Text
            className="mt-0.5 text-sm font-semibold leading-5 text-gray-900"
            numberOfLines={2}
          >
            {storeName}
          </Text>
          {showStoreCode ? (
            <Text className="mt-0.5 text-xs text-gray-400">{storeCode}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default React.memo(AddEmployeeConfirmContent);
