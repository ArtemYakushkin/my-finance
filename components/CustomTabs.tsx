import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
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
};

const CustomTabs = ({ state, descriptors, navigation }: BottomTabBarProps) => {
	const tabbarIcons: any = {
		index: (isFocused: boolean) => (
			<Icons.House
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors.primaryLight : colors.neutral400}
			/>
		),
		statistics: (isFocused: boolean) => (
			<Icons.ChartBar
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors.primaryLight : colors.neutral400}
			/>
		),
		wallet: (isFocused: boolean) => (
			<Icons.Wallet
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors.primaryLight : colors.neutral400}
			/>
		),
		profile: (isFocused: boolean) => (
			<Icons.User
				size={28}
				weight={isFocused ? 'fill' : 'regular'}
				color={isFocused ? colors.primaryLight : colors.neutral400}
			/>
		),
	};

	return (
		<View style={[globalStyles.tabBar]}>
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key];
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
						key={route.name}
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
								<LinearGradient {...BUTTON_GRADIENT} style={globalStyles.tabButton}>
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
