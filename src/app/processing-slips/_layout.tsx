import { Stack } from 'expo-router';
import Header from '~/src/components/shared/header';

export default function ProcessingSlipsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          header: () => <Header title="Phiếu xử lý" />,
        }}
      />
    </Stack>
  );
}
