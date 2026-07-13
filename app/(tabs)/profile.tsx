import Header from '@/components/Header';
import ProfileModal from '@/components/ProfileModal';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { auth } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { SHADOW_AVATAR, SHADOW_OPTIONS } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import * as Icons from 'phosphor-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Shadow } from 'react-native-shadow-2';

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
	const [modalVisible, setModalVisible] = useState(false);

	const accountOptions: accountOptionType[] = [
		{
			title: 'Редагувати профіль',
			icon: <Icons.User size={24} color={colors.white} weight="fill" />,
			onPress: () => setModalVisible(true),
			bgColor: '#6366f1',
		},
		{
			title: 'Налаштування',
			icon: <Icons.GearSix size={24} color={colors.white} weight="fill" />,
			routeName: '/settings',
			bgColor: '#059669',
		},
		{
			title: 'Конфіденційність',
			icon: <Icons.Lock size={24} color={colors.white} weight="fill" />,
			bgColor: colors.neutral600,
		},
		{
			title: 'Вийти',
			icon: <Icons.Power size={24} color={colors.white} weight="fill" />,
			bgColor: '#e11d48',
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
		// 1. Проверка на логаут
		if (item.title === 'Вийти') {
			Alert.alert('Вихід з аккаунта', 'Ви дійсно хочете вийти?', [
				{ text: 'Скасувати', style: 'cancel' },
				{
					text: 'Вийти',
					style: 'destructive',
					onPress: async () => {
						try {
							await signOut(auth);
						} catch (error) {
							Alert.alert('Помилка', 'Не вдалося вийти з системи.');
						}
					},
				},
			]);
			return;
		}

		// 2. ДОБАВЛЯЕМ СЮДА: Проверка на открытие твоей библиотечной модалки
		if (item.title === 'Редагувати профіль') {
			setModalVisible(true); // Твой стейт для управления react-native-modal
			return; // Обязательно ретёрнимся, чтобы код не шёл дальше к роутеру
		}

		// 3. Обычный роутинг для остальных страниц-модалок
		if (item.routeName) {
			router.push(item.routeName as any);
		}
	};

	if (loading) {
		return (
			<ScreenWrapper>
				<View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
					<ActivityIndicator size="large" color={colors.primaryLight || '#fff'} />
				</View>
			</ScreenWrapper>
		);
	}

	return (
		<ScreenWrapper>
			<View style={globalStyles.container}>
				<Header title="Профіль" />

				<View style={globalStyles.profileInfo}>
					<Shadow {...SHADOW_AVATAR.light} style={{ borderRadius: 200 }}>
						<Shadow {...SHADOW_AVATAR.dark} style={{ borderRadius: 200 }}>
							<Image
								source={getAvatarSource()}
								style={globalStyles.profileAvatar}
								contentFit="cover"
								transition={150}
							/>
						</Shadow>
					</Shadow>

					<View style={globalStyles.profileNameContainer}>
						<Typo size={24} fontWeight={'600'} color={colors.neutral100}>
							{user?.name || 'Користувач'}
						</Typo>
						<Typo size={15} color={colors.neutral400}>
							{user?.email || 'Немає адреси'}
						</Typo>
					</View>
				</View>

				<View style={{ paddingHorizontal: 10 }}>
					<Shadow {...SHADOW_OPTIONS.light} style={{ borderRadius: 20 }}>
						<Shadow {...SHADOW_OPTIONS.dark} style={{ borderRadius: 20 }}>
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
												<Typo size={16} fontWeight={'500'} style={{ flex: 1 }}>
													{item.title}
												</Typo>
												<Icons.CaretRight size={18} weight="bold" color={colors.neutral500} />
											</TouchableOpacity>

											{!isLast && <View style={globalStyles.profileOptionsSeparator} />}
										</Animated.View>
									);
								})}
							</View>
						</Shadow>
					</Shadow>
				</View>
			</View>

			<ProfileModal visible={modalVisible} onClose={() => setModalVisible(false)} />
		</ScreenWrapper>
	);
};

export default Profile;
