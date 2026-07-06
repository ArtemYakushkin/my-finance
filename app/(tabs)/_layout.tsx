import CustomTabs from '@/components/CustomTabs';
import { Tabs } from 'expo-router';

export default function TabLayout() {
	return (
		<Tabs tabBar={CustomTabs} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" />
			<Tabs.Screen name="statistics" />
			<Tabs.Screen name="transaction" />
			<Tabs.Screen name="wallet" />
			<Tabs.Screen name="profile" />
		</Tabs>
	);
}
