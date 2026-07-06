// import { colors } from '@/constants/theme';
// import { AuthProvider, useAuth } from '@/context/useAuth';
// import { Slot, useRouter, useSegments } from 'expo-router';
// import { useEffect } from 'react';
// import { ActivityIndicator, View } from 'react-native';

// function MainLayout() {
// 	const { user, loading } = useAuth();
// 	const segments = useSegments();
// 	const router = useRouter();

// 	useEffect(() => {
// 		// Запрещаем редиректы, пока Firebase инициализируется и проверяет локальный токен
// 		if (loading) return;

// 		const inAuthGroup = segments[0] === '(auth)';

// 		// Используем макро-задачу для планировщика React.
// 		// Это предотвращает вызовы редиректа до полного построения дерева роутов.
// 		const timer = setTimeout(() => {
// 			if (!user && !inAuthGroup) {
// 				// Если сессии нет и мы не в авторизации — отправляем на welcome
// 				router.replace('/(auth)/welcome');
// 			} else if (user && inAuthGroup) {
// 				// Если сессия восстановилась, а мы были на экране логина — пускаем в табы
// 				router.replace('/(tabs)');
// 			}
// 		}, 0);

// 		return () => clearTimeout(timer);
// 	}, [user, segments, loading]);

// 	// Качественный полноэкранный индикатор загрузки при старте приложения
// 	if (loading) {
// 		return (
// 			<View
// 				style={{
// 					flex: 1,
// 					justifyContent: 'center',
// 					alignItems: 'center',
// 					backgroundColor: colors.black || '#000',
// 				}}
// 			>
// 				<ActivityIndicator
// 					size="large"
// 					color={colors.primaryLight || '#fff'}
// 				/>
// 			</View>
// 		);
// 	}

// 	return <Slot />;
// }

// export default function RootLayout() {
// 	return (
// 		<AuthProvider>
// 			<MainLayout />
// 		</AuthProvider>
// 	);
// }

import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/useAuth';
import { Stack, useRouter, useSegments } from 'expo-router'; // Заменили Slot на Stack
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function MainLayout() {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		// Запрещаем редиректы, пока Firebase инициализируется и проверяет локальный токен
		if (loading) return;

		const inAuthGroup = segments[0] === '(auth)';

		// Используем макро-задачу для планировщика React.
		// Это предотвращает вызовы редиректа до полного построения дерева роутов.
		const timer = setTimeout(() => {
			if (!user && !inAuthGroup) {
				// Если сессии нет и мы не в авторизации — отправляем на welcome
				router.replace('/(auth)/welcome');
			} else if (user && inAuthGroup) {
				// Если сессия восстановилась, а мы были на экране логина — пускаем в табы
				router.replace('/(tabs)');
			}
		}, 0);

		return () => clearTimeout(timer);
	}, [user, segments, loading]);

	// Качественный полноэкранный индикатор загрузки при старте приложения
	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: colors.black || '#000',
				}}
			>
				<ActivityIndicator size="large" color={colors.primaryLight || '#fff'} />
			</View>
		);
	}

	// Вместо <Slot /> настраиваем нативный стек экранов
	return (
		<Stack screenOptions={{ headerShown: false }}>
			{/* Группа основных табов */}
			<Stack.Screen name="(tabs)" />

			{/* Группа экранов авторизации */}
			<Stack.Screen name="(auth)" />

			{/* Страница-модал кошелька. Настраиваем нативную анимацию появления */}
			<Stack.Screen
				name="(modals)/walletModal"
				options={{
					presentation: 'transparentModal', // Для красивого наложения без сброса стека табов
					animation: 'slide_from_bottom', // Плавное появление снизу
				}}
			/>
			<Stack.Screen
				name="(modals)/searchModal"
				options={{
					presentation: 'transparentModal', // Для красивого наложения без сброса стека табов
					animation: 'slide_from_bottom', // Плавное появление снизу
				}}
			/>
			<Stack.Screen
				name="(modals)/addCategoryModal"
				options={{
					presentation: 'transparentModal', // Для красивого наложения без сброса стека табов
					animation: 'slide_from_bottom', // Плавное появление снизу
				}}
			/>
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<MainLayout />
		</AuthProvider>
	);
}
