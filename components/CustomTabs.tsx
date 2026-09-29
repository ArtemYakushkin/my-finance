import { getGlobalStyles } from '@/constants/global';
import { getGradients } from '@/constants/gradient';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { TabNavigationState } from 'expo-router';
import { NavigationHelpers, ParamListBase } from 'expo-router/build/react-navigation';
import {
	BottomTabDescriptorMap,
	BottomTabNavigationEventMap,
} from 'expo-router/build/react-navigation/bottom-tabs/types';
import * as Icons from 'phosphor-react-native';
import { TouchableOpacity, View } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';

type BottomTabBarProps = {
	state: TabNavigationState<ParamListBase>;
	descriptors: BottomTabDescriptorMap;
	navigation: NavigationHelpers<ParamListBase, BottomTabNavigationEventMap>;
	insets: EdgeInsets;
	isDark?: boolean;
};

const CustomTabs = ({ state, descriptors, navigation, isDark }: BottomTabBarProps) => {
	const { colors, isDark: contextIsDark } = useTheme();
	const activeIsDark = isDark ?? contextIsDark;
	const globalStyles = getGlobalStyles(colors, activeIsDark);
	const gradients = getGradients(colors);
	// const buttonGradient = gradients.BUTTON_GRADIENT;
	const routes = state?.routes || [];

	const tabbarIcons: Record<string, (isFocused: boolean) => React.ReactNode> = {
		index: (isFocused: boolean) => (
			<Icons.House
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors?.primaryLight || '#2563eb' : colors?.neutral350 || '#a3a3a3'}
			/>
		),
		statistics: (isFocused: boolean) => (
			<Icons.ChartBar
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors?.primaryLight || '#2563eb' : colors?.neutral350 || '#a3a3a3'}
			/>
		),
		wallet: (isFocused: boolean) => (
			<Icons.Wallet
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors?.primaryLight || '#2563eb' : colors?.neutral350 || '#a3a3a3'}
			/>
		),
		profile: (isFocused: boolean) => (
			<Icons.User
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors?.primaryLight || '#2563eb' : colors?.neutral350 || '#a3a3a3'}
			/>
		),
	};

	const buttonGradient = isDark ? gradients.BUTTON_GRADIENT : gradients.BUTTON_GRADIENT_WHITE;

	return (
		<View style={[globalStyles.tabBar]}>
			{routes.map((route, index) => {
				const isFocused = state.index === index;

				const onPress = () => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
						canPreventDefault: true,
					});
					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name, route.params);
					}
				};

				return (
					<View
						key={route.key}
						style={{
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						{isFocused ? (
							<TouchableOpacity
								onPress={onPress}
								style={[globalStyles.tabItem, globalStyles.tabActiveItem]}
							>
								<LinearGradient
									colors={buttonGradient.colors}
									start={buttonGradient.start}
									end={buttonGradient.end}
									style={globalStyles.tabButton}
								>
									{tabbarIcons[route.name]?.(isFocused)}
								</LinearGradient>
							</TouchableOpacity>
						) : (
							<TouchableOpacity onPress={onPress} style={globalStyles.tabItem}>
								{tabbarIcons[route.name]?.(isFocused)}
							</TouchableOpacity>
						)}
					</View>
				);
			})}
		</View>
	);
};

export default CustomTabs;
