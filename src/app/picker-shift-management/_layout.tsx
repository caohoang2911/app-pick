import { Stack } from 'expo-router';
import Header from '~/src/components/shared/header';

export default function PickerShiftManagementLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          header: () => <Header title="Quản lý ca FullTime Picker" />,
        }}
      />
    </Stack>
  );
}
