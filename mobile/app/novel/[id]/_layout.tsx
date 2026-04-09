import { Stack } from 'expo-router';

export default function NovelLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="chapter/[chapterId]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
