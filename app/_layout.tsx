import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { getGlobalStyles } from '@/constants/global';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/useAuth';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, LogBox, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';

LogBox.ignoreLogs(['InteractionManager has been deprecated', 'Accessing element.ref was removed in React 19']);

function MainLayout() {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();
	const [isAppReady, setIsAppReady] = useState(false);

	const { colors } = useTheme();
	const globalStyles = getGlobalStyles(colors);

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
					<View style={{ justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
						<Image
							style={globalStyles.logo}
							resizeMode="contain"
							source={require('../assets/images/logo.png')}
						/>
						<Typo size={24} color={colors.neutral200} style={{ marginBottom: 20 }}>
							My finance
						</Typo>
					</View>
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
			<Stack.Screen
				name="(modals)/manageCatModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="(modals)/monthModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="(modals)/currencyModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="(modals)/profileModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>
			<Stack.Screen
				name="(modals)/detailModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>

			<Stack.Screen
				name="(modals)/plannedModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>

			<Stack.Screen
				name="(modals)/transactionModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>

			<Stack.Screen
				name="(modals)/settingsModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>

			<Stack.Screen
				name="(modals)/privacyModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>

			<Stack.Screen
				name="(modals)/calendarModal"
				options={{
					presentation: 'transparentModal',
					animation: 'slide_from_bottom',
				}}
			/>

			<Stack.Screen
				name="(modals)/exchangeRateModal"
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
		<ThemeProvider>
			<AuthProvider>
				<MainLayout />

				<FlashMessage
					position="top"
					floating={true}
					titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
					textStyle={{ fontSize: 14 }}
					duration={3500}
					style={{ marginTop: 40 }}
				/>
			</AuthProvider>
		</ThemeProvider>
	);
}
