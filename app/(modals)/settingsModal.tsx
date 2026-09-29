import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
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

const SettingsModal = () => {
	const router = useRouter();

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const settingsOptions: settingsOptionsType[] = [
		{
			title: 'Валюта за замовчуванням',
			icon: (
				<Icons.CurrencyCircleDollar
					size={24}
					color={isDark ? colors.neutral100 : colors.neutral900}
					weight="fill"
				/>
			),
			routeName: '/(modals)/currencyModal',
			bgColor: colors.green,
		},
		{
			title: 'Початок фінансового місяця',
			icon: <Icons.CalendarDots size={24} color={isDark ? colors.neutral100 : colors.neutral900} weight="fill" />,
			routeName: '/(modals)/monthModal',
			bgColor: colors.orange,
		},
		{
			title: 'Налаштування категорій',
			icon: <Icons.AlignBottom size={24} color={isDark ? colors.neutral100 : colors.neutral900} weight="fill" />,
			routeName: '/(modals)/manageCatModal',
			bgColor: colors.primaryDark,
		},
	];

	const handlePress = (item: settingsOptionsType) => {
		if (item.routeName) {
			router.push(item.routeName as any);
		}
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={'Налаштування'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.statScrollContent} showsVerticalScrollIndicator={false}>
					<View style={globalStyles.profileOptions}>
						{settingsOptions.map((item, index) => {
							const isLast = index === settingsOptions.length - 1;
							return (
								<Animated.View entering={FadeInDown.delay(index * 50).springify()} key={index}>
									<TouchableOpacity
										style={globalStyles.profileOptionsItem}
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
										<Typo
											size={16}
											fontWeight={'500'}
											color={colors.neutral100}
											style={{ flex: 1 }}
										>
											{item.title}
										</Typo>
										<Icons.CaretRight size={18} weight="bold" color={colors.neutral500} />
									</TouchableOpacity>

									{!isLast && <View style={globalStyles.profileOptionsSeparator} />}
								</Animated.View>
							);
						})}
					</View>
				</ScrollView>
			</View>
		</ModalWrapper>
	);
};

export default SettingsModal;
