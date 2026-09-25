import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { showErrorToast, showWarningToast } from '@/utils/showToast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const categoryGroups = [
	{ label: 'База', value: 'needs', color: colors.primary },
	{ label: 'Хочу', value: 'desires', color: colors.rose },
	{ label: 'Резерв', value: 'saving', color: colors.primaryLight },
];

// Список доступных иконок для финансовых категорий
const CATEGORY_ICONS = [
	// Еда и Напитки
	'ShoppingBag',
	'ShoppingCart',
	'Utensils',
	'Coffee',
	'Pizza',
	'Hamburger',
	'Wine',
	'Cake',

	// Дом, Коммуналка и Быт
	'House',
	'Lightning',
	'Drop',
	'WifiHigh',
	'Wrench',
	'Trash',
	'Key',
	'Broom',

	// Транспорт и Авто
	'Car',
	'GasPump',
	'Bus',
	'Train',
	'Taxi',
	'Bicycle',
	'Airplane',
	'NavigationArrow',

	// Здоровье и Красота
	'FirstAid',
	'Activity',
	'Pill',
	'Barbell',
	'Scissors',
	'Sparkle',
	'Smiley',

	// Развлечения и Досуг
	'GameController',
	'FilmStrip',
	'MusicalNotes',
	'BookOpen',
	'Ticket',
	'Basketball',
	'BeerBottle',
	'Palette',

	// Покупки и Подарки
	'Tag',
	'Gift',
	'TShirt',
	'Sneaker',
	'Storefront',
	'Package',

	// Техника и Связь
	'Phone',
	'Desktop',
	'Laptop',
	'Headphones',
	'Camera',
	'Television',

	// Финансы и Услуги
	'CreditCard',
	'Bank',
	'Coins',
	'Receipt',
	'TrendingUp',
	'ShieldCheck',
	'GraduationCap',
	'Briefcase',
	'User',
	'Users',
	'PawPrint',
];

const AddCategoryModal = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { type, group } = useLocalSearchParams<{ type: string; group: string }>();

	const [loading, setLoading] = useState(false);
	const [category, setCategory] = useState({
		name: '',
		icon: 'ShoppingBag',
		type: type || 'expense',
		group: group || 'needs',
	});

	const handleSaveCategory = async () => {
		if (!category.name.trim()) {
			showWarningToast('Введіть назву підкатегорії');
			return;
		}

		if (!category.icon) {
			showWarningToast('Виберіть іконку для категорії');
			return;
		}

		if (!user?.uid) {
			showErrorToast('Користувач не авторизован');
			return;
		}

		setLoading(true);
		try {
			await addDoc(collection(db, 'categories'), {
				uid: user.uid,
				name: category.name.trim(),
				icon: category.icon,
				type: category.type,
				group: category.group,
				createdAt: serverTimestamp(),
			});
			router.back();
		} catch (error) {
			showErrorToast('Не вдалося зберегти категорію. Спробуйте ще раз');
		} finally {
			setLoading(false);
		}
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
				<Header title={'Нова категорія'} leftIcon={<BackButton />} />

				<ScrollView
					contentContainerStyle={globalStyles.modalForm}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					{category.type === 'expense' && (
						<View style={{ gap: 10 }}>
							<Typo color={colors.neutral200} size={16}>
								Виберіть групу
							</Typo>
							<View style={{ width: '100%' }}>
								<View style={globalStyles.statSegmentWrap}>
									{categoryGroups.map((groupItem) => {
										const isActive = category.group === groupItem.value;
										return (
											<TouchableOpacity
												key={groupItem.value}
												style={globalStyles.statSegmentBtn}
												onPress={() => setCategory({ ...category, group: groupItem.value })}
											>
												{isActive ? (
													<View style={globalStyles.statSegmentActive}>
														<Typo size={13} fontWeight={'500'} color={groupItem.color}>
															{groupItem.label}
														</Typo>
													</View>
												) : (
													<Typo
														size={13}
														color={colors.neutral400}
														style={{ textAlign: 'center' }}
													>
														{groupItem.label}
													</Typo>
												)}
											</TouchableOpacity>
										);
									})}
								</View>
							</View>
						</View>
					)}

					<View style={{ gap: 10 }}>
						<Typo color={colors.neutral200} size={16}>
							Назва підкатегорії
						</Typo>
						<Input
							placeholder="Наприклад: Продукти або Житло"
							value={category.name}
							onChangeText={(value) => setCategory({ ...category, name: value })}
						/>
					</View>

					<View style={{ gap: 10 }}>
						<Typo color={colors.neutral200} size={16}>
							Виберіть іконку
						</Typo>
						<View
							style={{
								flexDirection: 'row',
								flexWrap: 'wrap',
								gap: 12,
								justifyContent: 'space-between',
							}}
						>
							{CATEGORY_ICONS.map((iconName) => {
								const IconComponent = (Icons as Record<string, React.ComponentType<any>>)[iconName];
								const isSelected = category.icon === iconName;

								return (
									<TouchableOpacity
										key={iconName}
										onPress={() => setCategory({ ...category, icon: iconName })}
										style={{
											width: 48,
											height: 48,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: isSelected ? colors.primaryLight : colors.neutral500,
											backgroundColor: isSelected ? colors.primaryLight : colors.gradientMid,
											justifyContent: 'center',
											alignItems: 'center',
										}}
									>
										{IconComponent ? (
											<IconComponent
												size={24}
												color={isSelected ? colors.neutral200 : colors.neutral200}
												weight={isSelected ? 'bold' : 'regular'}
											/>
										) : null}
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				<Button onPress={handleSaveCategory} loading={loading} disabled={loading} style={{ flex: 1 }}>
					<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
						Зберегти
					</Typo>
				</Button>
			</View>
		</ModalWrapper>
	);
};

export default AddCategoryModal;
