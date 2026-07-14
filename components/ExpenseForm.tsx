import { FormRefActions } from '@/app/(tabs)/transaction';
import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT, INPUT_GRADIENT } from '@/constants/gradient';
import { SHADOW_DROPDOWN, SHADOW_INPUT } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { transactionService } from '@/services/transactionService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { showMessage } from 'react-native-flash-message';
import { Shadow } from 'react-native-shadow-2';
import Button from './Button';
import CalculatorModal from './CalculatorModal';
import Input from './Input';
import Typo from './Typo';

const categoryGroups = [
	{ label: 'База', value: 'needs', color: '#4a90e2', icon: Icons.HouseLine },
	{ label: 'Хочу', value: 'desires', color: '#ef4444', icon: Icons.Star },
	{ label: 'Резерв', value: 'saving', color: '#a3e635', icon: Icons.PiggyBank },
];

type CategoryItem = {
	label: string;
	value: string;
	group: string;
	type: 'expense' | 'income';
};

type Props = {
	wallets: { label: string; value: string }[];
	categories: CategoryItem[];
	setLoading: (loading: boolean) => void;
	oldData?: any;
};

const ExpenseForm = forwardRef<FormRefActions, Props>(({ wallets, categories = [], setLoading, oldData }, ref) => {
	const { user } = useAuth();
	const router = useRouter();

	const [walletId, setWalletId] = useState(oldData?.walletId || '');
	const [selectedGroup, setSelectedGroup] = useState(oldData?.categoryGroup || '');
	const [subCategory, setSubCategory] = useState(oldData?.category || '');
	const [date, setDate] = useState(new Date());
	const [amount, setAmount] = useState<number>(oldData?.amount || 0);
	const [description, setDescription] = useState(oldData?.description || '');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);

	const resetForm = () => {
		setWalletId('');
		setSelectedGroup('');
		setSubCategory('');
		setDate(new Date());
		setAmount(0);
		setDescription('');
	};

	useEffect(() => {
		if (oldData) {
			setWalletId(oldData.walletId || '');
			setSelectedGroup(oldData.categoryGroup || '');
			setSubCategory(oldData.category || '');
			setAmount(Number(oldData.amount || 0));
			setDescription(oldData.description || '');

			if (oldData.date) {
				if (oldData.date.seconds) {
					setDate(new Date(oldData.date.seconds * 1000));
				} else {
					setDate(new Date(oldData.date));
				}
			} else {
				setDate(new Date());
			}
		} else {
			setWalletId('');
			setSelectedGroup('');
			setSubCategory('');
			setDate(new Date());
			setAmount(0);
			setDescription('');
		}
	}, [oldData]);

	const currentSubCategories = categories.filter((cat) => cat.group === selectedGroup && cat.type === 'expense');

	useImperativeHandle(ref, () => ({
		submit: () => {
			handleSaveExpense();
		},
	}));

	const handleNavigateToAddCategory = () => {
		router.push({
			pathname: '/(modals)/addCategoryModal',
			params: {
				type: 'expense',
				group: selectedGroup,
			},
		});
	};

	const handleCategorySelectPress = () => {
		if (currentSubCategories.length === 0) {
			handleNavigateToAddCategory();
		}
	};

	const handleDateChange = (event: any, selectedDate?: Date) => {
		if (Platform.OS === 'android') {
			setShowDatePicker(false);
		}
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	const handleSaveExpense = async () => {
		if (!user?.uid) return;
		if (!walletId) {
			showMessage({
				message: 'Помилка',
				description: 'Виберіть гаманець списання',
				type: 'warning',
				icon: 'warning',
			});
			return;
		}
		if (!selectedGroup) {
			showMessage({
				message: 'Помилка',
				description: 'Виберіть групу категорій',
				type: 'warning',
				icon: 'warning',
			});
			return;
		}
		if (!subCategory) {
			showMessage({
				message: 'Помилка',
				description: 'Виберіть або створіть підкатегорію',
				type: 'warning',
				icon: 'warning',
			});
			return;
		}
		if (amount <= 0) {
			showMessage({
				message: 'Помилка',
				description: 'Сума повинна бути більша за 0',
				type: 'warning',
				icon: 'warning',
			});
			return;
		}

		try {
			setLoading(true);

			if (oldData?.id) {
				await transactionService.updateTransaction(
					oldData.id,
					{
						uid: user.uid,
						type: 'expense',
						amount,
						walletId,
						categoryGroup: selectedGroup,
						category: subCategory,
						date,
						description: description.trim(),
					},
					oldData,
				);
			} else {
				await transactionService.createTransaction({
					uid: user.uid,
					type: 'expense',
					amount,
					walletId,
					categoryGroup: selectedGroup,
					category: subCategory,
					date,
					description: description.trim(),
				});
			}

			resetForm();
			router.replace('/(tabs)');
		} catch (error: any) {
			showMessage({
				message: 'Помилка',
				description: error.message || 'Щось пішло не так',
				type: 'danger',
				icon: 'danger',
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={{ gap: 20, paddingBottom: 40 }}>
			{/* Вибір кошелька */}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
					Гаманець
				</Typo>
				<View style={globalStyles.modalDropdownShadowHolder}>
					<Shadow {...SHADOW_DROPDOWN.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
						<Shadow {...SHADOW_DROPDOWN.dark} style={{ alignSelf: 'stretch' }}>
							<LinearGradient
								{...(BUTTON_GRADIENT as any)}
								style={{
									borderRadius: 17,
									overflow: 'hidden',
									height: 56,
									justifyContent: 'center',
								}}
							>
								<Dropdown
									style={[
										globalStyles.modalDropdownContainer,
										{ backgroundColor: 'transparent', borderWidth: 0 },
									]}
									activeColor={colors.gradientStart}
									placeholderStyle={{ color: colors.white }}
									selectedTextStyle={{ color: colors.white, fontSize: 14 }}
									iconStyle={{ height: 30, tintColor: colors.neutral300 }}
									maxHeight={300}
									itemTextStyle={{ color: colors.white }}
									itemContainerStyle={{ borderRadius: 15, marginHorizontal: 7 }}
									containerStyle={{
										backgroundColor: colors.gradientEnd,
										borderRadius: 15,
										borderCurve: 'continuous',
										paddingVertical: 7,
										top: 5,
										borderColor: colors.gradientStart,
										shadowColor: colors.black,
										shadowOffset: { width: 0, height: 5 },
										shadowOpacity: 1,
										shadowRadius: 15,
										elevation: 5,
									}}
									data={wallets}
									labelField="label"
									valueField="value"
									placeholder={'Вибрати гаманець'}
									value={walletId}
									onChange={(item) => setWalletId(item.value)}
								/>
							</LinearGradient>
						</Shadow>
					</Shadow>
				</View>
			</View>

			{/* Вибір групи категорій */}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
					Група категорій
				</Typo>
				<View style={globalStyles.modalBtnWrap}>
					{categoryGroups.map((group) => {
						const isActive = selectedGroup === group.value;
						return (
							<Button
								key={group.value}
								onPress={() => {
									setSelectedGroup(group.value);
									setSubCategory('');
								}}
								style={{ flex: 1 }}
							>
								<Typo
									size={14}
									fontWeight={isActive ? '700' : '500'}
									color={isActive ? group.color : colors.neutral400}
								>
									{group.label}
								</Typo>
							</Button>
						);
					})}
				</View>
			</View>

			{/* Вибір і створення підкатегорії */}
			{selectedGroup && (
				<View style={{ gap: 10 }}>
					<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
						Підкатегорія
					</Typo>

					{currentSubCategories.length > 0 ? (
						<View style={globalStyles.modalDropdownShadowHolder}>
							<Shadow {...SHADOW_DROPDOWN.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
								<Shadow {...SHADOW_DROPDOWN.dark} style={{ alignSelf: 'stretch' }}>
									<LinearGradient
										{...(BUTTON_GRADIENT as any)}
										style={{
											borderRadius: 17,
											overflow: 'hidden',
											height: 56,
											justifyContent: 'center',
										}}
									>
										<Dropdown
											style={[
												globalStyles.modalDropdownContainer,
												{ backgroundColor: 'transparent', borderWidth: 0 },
											]}
											activeColor={colors.gradientStart}
											placeholderStyle={{ color: colors.white }}
											selectedTextStyle={{
												color: colors.white,
												fontSize: 14,
											}}
											iconStyle={{ height: 30, tintColor: colors.neutral300 }}
											maxHeight={300}
											itemTextStyle={{ color: colors.white }}
											itemContainerStyle={{
												borderRadius: 15,
												marginHorizontal: 7,
											}}
											containerStyle={{
												backgroundColor: colors.gradientEnd,
												borderRadius: 15,
												borderCurve: 'continuous',
												paddingVertical: 7,
												top: 5,
												borderColor: colors.gradientStart,
												shadowColor: colors.black,
												shadowOffset: { width: 0, height: 5 },
												shadowOpacity: 1,
												shadowRadius: 15,
												elevation: 5,
											}}
											data={currentSubCategories}
											labelField="label"
											valueField="value"
											placeholder={'Вибрати підкатегорію'}
											onFocus={handleCategorySelectPress}
											value={subCategory}
											onChange={(item) => setSubCategory(item.value)}
										/>
									</LinearGradient>
								</Shadow>
							</Shadow>
						</View>
					) : (
						<Typo color={colors.rose} size={14} style={{ marginTop: 10, paddingLeft: 10 }}>
							У цій групі ще немає категорій. Додати?
						</Typo>
					)}

					<TouchableOpacity style={globalStyles.modalAddCategory} onPress={handleNavigateToAddCategory}>
						<Icons.PlusCircle weight="fill" color={colors.primaryLight} size={33} />
						<Typo color={colors.neutral500} size={16}>
							Додати підкатегорію витрат
						</Typo>
					</TouchableOpacity>
				</View>
			)}

			{/* Блок дати */}
			<View style={{ gap: 10, paddingHorizontal: 5 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
					Дата
				</Typo>

				{!showDatePicker && (
					<View style={globalStyles.modalInputContainer}>
						<Shadow {...SHADOW_INPUT.light} style={{ alignSelf: 'stretch' }}>
							<Shadow {...SHADOW_INPUT.dark} style={{ alignSelf: 'stretch' }}>
								<LinearGradient {...INPUT_GRADIENT} style={globalStyles.modalInputInner}>
									<Pressable style={globalStyles.modalInput} onPress={() => setShowDatePicker(true)}>
										<Typo size={14}>{date.toLocaleDateString('uk-UA')}</Typo>
									</Pressable>
								</LinearGradient>
							</Shadow>
						</Shadow>
					</View>
				)}

				{showDatePicker && (
					<View>
						<DateTimePicker
							themeVariant="dark"
							value={date}
							textColor={colors.white}
							mode="date"
							display="spinner"
							onChange={handleDateChange}
						/>
						{Platform.OS === 'ios' && (
							<TouchableOpacity onPress={() => setShowDatePicker(false)}>
								<Typo size={15} fontWeight={500} color={colors.primary}>
									Ok
								</Typo>
							</TouchableOpacity>
						)}
					</View>
				)}
			</View>

			{/* Блок введення суми */}
			<View style={{ gap: 10, paddingHorizontal: 5 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
					Сума
				</Typo>
				<View style={globalStyles.modalInputContainer}>
					<Shadow {...SHADOW_INPUT.light} style={{ alignSelf: 'stretch' }}>
						<Shadow {...SHADOW_INPUT.dark} style={{ alignSelf: 'stretch' }}>
							<LinearGradient {...INPUT_GRADIENT} style={globalStyles.modalInputInner}>
								<Pressable style={globalStyles.modalInput} onPress={() => setShowCalcModal(true)}>
									<Typo size={14}>{amount === 0 ? 'Ввести суму' : `${amount}`}</Typo>
								</Pressable>
							</LinearGradient>
						</Shadow>
					</Shadow>
				</View>
			</View>

			{/* Блок опису */}
			<View style={{ gap: 10, paddingHorizontal: 5 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
					Опис
				</Typo>
				<Input value={description} onChangeText={setDescription} />
			</View>

			<CalculatorModal
				isVisible={showCalcModal}
				initialValue={amount === 0 ? '' : amount.toString()}
				onClose={() => setShowCalcModal(false)}
				onSelectAmount={(value: number) => {
					setAmount(value);
					setShowCalcModal(false);
				}}
			/>
		</View>
	);
});

ExpenseForm.displayName = 'ExpenseForm';

export default ExpenseForm;
