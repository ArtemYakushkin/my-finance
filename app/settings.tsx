import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type settingsOptionsType = {
	title: string;
	icon: React.ReactNode;
	bgColor: string;
	routeName?: any;
	onPress?: () => void;
};

const Settings = () => {
	const router = useRouter();

	const settingsOptions: settingsOptionsType[] = [
		{
			title: 'Валюта за замовчуванням',
			icon: <Icons.CurrencyCircleDollar size={24} color={colors.white} weight="fill" />,
			routeName: '/(modals)/currencyModal',
			bgColor: '#292e3a',
		},
		{
			title: 'Початок фінансового місяця',
			icon: <Icons.CalendarDots size={24} color={colors.white} weight="fill" />,
			routeName: '/(modals)/monthModal',
			bgColor: '#171921',
		},
		{
			title: 'Налаштування категорій',
			icon: <Icons.AlignBottom size={24} color={colors.white} weight="fill" />,
			routeName: '/(modals)/manageCatModal',
			bgColor: '#0c0d12',
		},
	];

	const handlePress = (item: settingsOptionsType) => {
		if (item.routeName) {
			router.push(item.routeName as any);
		}
	};

	return (
		<ScreenWrapper>
			<View style={globalStyles.container}>
				<Header title={'Налаштування'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.statScrollContent} showsVerticalScrollIndicator={false}>
					{settingsOptions.map((item, index) => {
						return (
							<Animated.View entering={FadeInDown.delay(index * 50).springify()} key={index}>
								<TouchableOpacity
									style={[globalStyles.profileOptionsItem, { paddingHorizontal: 10 }]}
									activeOpacity={0.6}
									onPress={() => handlePress(item)}
								>
									<View
										style={[
											globalStyles.profileOptionsIcon,
											{
												backgroundColor: item.bgColor,
											},
										]}
									>
										{item.icon}
									</View>
									<Typo size={16} fontWeight={'500'} style={{ flex: 1 }}>
										{item.title}
									</Typo>
									<Icons.CaretRight size={18} weight="bold" color={colors.neutral500} />
								</TouchableOpacity>

								<View style={globalStyles.profileOptionsSeparator} />
							</Animated.View>
						);
					})}
				</ScrollView>
			</View>
		</ScreenWrapper>
	);
};

export default Settings;
