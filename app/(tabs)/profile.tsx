import { ConfirmModal } from '@/components/ConfirmModal';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { auth } from '@/config/firebase';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { showErrorToast } from '@/utils/showToast';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import * as Icons from 'phosphor-react-native';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type accountOptionType = {
	title: string;
	icon: React.ReactNode;
	bgColor: string;
	routeName?: any;
	onPress?: () => void;
};

const defaultAvatar = require('../../assets/images/avatar.png');

const Profile = () => {
	const { user, loading } = useAuth();
	const router = useRouter();
	const [confirmVisible, setConfirmVisible] = useState(false);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const accountOptions: accountOptionType[] = [
		{
			title: 'Налаштування',
			icon: <Icons.GearSix size={21} color={isDark ? colors.neutral100 : colors.neutral900} weight="fill" />,
			routeName: '/(modals)/settingsModal',
			bgColor: colors.green,
		},
		{
			title: 'Планування',
			icon: <Icons.CalendarDots size={21} color={isDark ? colors.neutral100 : colors.neutral900} weight="fill" />,
			routeName: '/(modals)/calendarModal',
			bgColor: colors.orange,
		},
		{
			title: 'Конфіденційність',
			icon: <Icons.Lock size={21} color={isDark ? colors.neutral100 : colors.neutral900} weight="fill" />,
			routeName: '/(modals)/privacyModal',
			bgColor: isDark ? colors.neutral600 : colors.neutral350,
		},
		{
			title: 'Вийти',
			icon: <Icons.Power size={21} color={isDark ? colors.neutral100 : colors.neutral900} weight="fill" />,
			bgColor: colors.rose,
		},
	];

	const getAvatarSource = () => {
		const avatarUrl = user?.image || user?.avatar;

		if (avatarUrl && avatarUrl.trim() !== '') {
			return { uri: avatarUrl };
		}
		return defaultAvatar;
	};

	const handlePress = (item: accountOptionType) => {
		if (item.title === 'Вийти') {
			setConfirmVisible(true);
			return;
		}
		if (item.routeName) {
			router.push(item.routeName as any);
		}
	};

	const handleLogout = async () => {
		setConfirmVisible(false);
		try {
			await signOut(auth);
		} catch (error: any) {
			showErrorToast('Не вдалося вийти з системи');
		}
	};

	if (loading) {
		return (
			<ScreenWrapper>
				<View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
					<Loading />
				</View>
			</ScreenWrapper>
		);
	}

	return (
		<ScreenWrapper>
			<View style={globalStyles.container}>
				<Header title="Профіль" />

				<View style={globalStyles.profileInfo}>
					<Image
						source={getAvatarSource()}
						style={globalStyles.profileAvatar}
						contentFit="cover"
						transition={150}
					/>

					<View style={globalStyles.profileNameContainer}>
						<Typo size={24} fontWeight={'600'} color={colors.neutral100}>
							{user?.name || 'Користувач'}
						</Typo>
						<Typo size={15} color={colors.neutral400}>
							{user?.email || 'Немає адреси'}
						</Typo>
					</View>
				</View>

				<View>
					<View style={globalStyles.profileOptions}>
						{accountOptions.map((item, index) => {
							const isLast = index === accountOptions.length - 1;
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
				</View>

				<ConfirmModal
					visible={confirmVisible}
					title="Вихід з аккаунта"
					message="Ви дійсно хочете вийти?"
					confirmText="Вийти"
					cancelText="Скасувати"
					onConfirm={handleLogout}
					onCancel={() => setConfirmVisible(false)}
				/>
			</View>
		</ScreenWrapper>
	);
};

export default Profile;
