import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Цвет активной вкладки (например, синий)
        tabBarActiveTintColor: "#2f95dc",
        // Цвет неактивной вкладки
        tabBarInactiveTintColor: "#ccc",
        // Показываем заголовок сверху экрана
        headerShown: true,
      }}
    >
      {/* Первая вкладка: Главный экран / Обзор */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Обзор",
          // Простая текстовая иконка вместо графических библиотек
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>💳</Text>
          ),
        }}
      />

      {/* Вторая вкладка: Графики и аналитика */}
      <Tabs.Screen
        name="two"
        options={{
          title: "Аналитика",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📊</Text>
          ),
        }}
      />
    </Tabs>
  );
}
