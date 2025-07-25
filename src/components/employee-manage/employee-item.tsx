import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { colors } from '~/src/ui/colors';
import { Employee } from '~/src/core/store/employee-manage';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';

interface EmployeeItemProps {
  employee: Employee;
  onPressAction: (employee: Employee) => void;
}

const EmployeeItem = memo(({ employee, onPressAction }: EmployeeItemProps) => {
  // Get config for role names
  const config = useConfig.use.config();
  const employeeRoles = config?.employeeRoles || [];
  const roleName = getConfigNameById(employeeRoles, employee.role);

  return (
    <View className="flex-row items-center p-4 bg-white border-b border-gray-100">
      {/* Avatar */}
      <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3">
        <Feather name="user" size={20} color={colors.gray[500]} />
      </View>
      
      {/* Employee Info */}
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">
          {employee.employeeId} - {employee.name}
        </Text>
        <View className="flex-row gap-2 mt-1">
          <View className="bg-blue-100 px-2 py-1 rounded-md">
            <Text className="text-xs font-medium text-blue-600">
              {roleName || employee.role}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-md ${
            employee.status === 'ACTIVE' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Text className={`text-xs font-medium ${
              employee.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
            }`}>
              {employee.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Action Button */}
      <TouchableOpacity
        onPress={() => onPressAction(employee)}
        className="p-2"
        activeOpacity={0.7}
      >
        <MaterialIcons name="more-vert" size={24} color={colors.gray[500]} />
      </TouchableOpacity>
    </View>
  );
});

EmployeeItem.displayName = 'EmployeeItem';

export default EmployeeItem; 