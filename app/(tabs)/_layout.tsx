import CustomTabs from '@/components/CustomTabs';
import { useTheme } from '@/context/ThemeContext';
import { Tabs } from 'expo-router';

export default function TabLayout() {
	const { isDark } = useTheme();
	return (
		<Tabs tabBar={(props) => <CustomTabs {...props} isDark={isDark} />} screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" />
			<Tabs.Screen name="statistics" />
			<Tabs.Screen name="wallet" />
			<Tabs.Screen name="profile" />
		</Tabs>
	);
}
