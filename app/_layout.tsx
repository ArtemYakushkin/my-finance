import ScreenWrapper from '@/components/ScreenWrapper';
import { globalStyles } from '@/constants/global';
import { AuthProvider, useAuth } from '@/context/useAuth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, LogBox, View } from 'react-native';

LogBox.ignoreLogs(['InteractionManager has been deprecated', 'Accessing element.ref was removed in React 19']);

function MainLayout() {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();
	const [isAppReady, setIsAppReady] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsAppReady(true);
		}, 2500);

		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (!isAppReady || loading) return;
		const inAuthGroup = segments[0] === '(auth)';
		if (!user && !inAuthGroup) {
			router.replace('/(auth)/welcome');
		} else if (user && inAuthGroup) {
			router.replace('/(tabs)');
		}
	}, [user, segments, loading, isAppReady]);

	if (!isAppReady || loading) {
		return (
			<ScreenWrapper>
				<View style={globalStyles.mainContainer}>
					<Image
						style={globalStyles.logo}
						resizeMode="contain"
						source={require('../assets/images/logo.png')}
					/>
				</View>
			</ScreenWrapper>
		);
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen name="(auth)" />
			<Stack.Screen
				name="(modals)/walletModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="(modals)/searchModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="(modals)/addCategoryModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
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
