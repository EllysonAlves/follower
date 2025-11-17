import { Stack } from 'expo-router';

export default function PostLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Post' }} />
      <Stack.Screen name="create" options={{ title: 'Criar Post' }} />
    </Stack>
  );
}