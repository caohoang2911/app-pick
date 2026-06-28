import { Stack } from 'expo-router';
import Header from '~/src/components/shared/header';

export default function SupportCenterLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          header: () => <Header title="Trung tâm hỗ trợ" />,
        }}
      />
    </Stack>
  );
}
