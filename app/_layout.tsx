import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  // Стейт авторизации (замените на вашу бэкенд-проверку в будущем)
  // false — пользователь гость (покажет экран login)
  // true — пользователь авторизован (покажет экран index с табами)
  const isAuthenticated = false;

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Проверяем, находится ли пользователь сейчас в группе авторизации
    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Если НЕ авторизован и НЕ в группе auth -> отправляем на логин
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      // Если АВТОРИЗОВАН и находится на экране логина -> отправляем в приложение
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, segments]);

  // Slot просто рендерит текущий активный экран в зависимости от роута
  return <Slot />;
}
