import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import CalculatorModal from '@/components/CalculatorModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import CustomDatePickerModal from '@/components/CustomDatePickerModal';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { auth, db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT, INPUT_GRADIENT } from '@/constants/gradient';
import { SHADOW_BLOCK, SHADOW_DROPDOWN, SHADOW_INPUT } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { PlannedTransaction } from '@/constants/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	query,
	serverTimestamp,
	updateDoc,
	where,
	writeBatch,
} from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { showMessage } from 'react-native-flash-message';
import { Shadow } from 'react-native-shadow-2';

interface DropdownOption {
	label: string;
	value: string;
}

const transactionTypes = [
	{ label: 'Витрата', value: 'expense' },
	{ label: 'Дохід', value: 'income' },
] as const;

const transactionColors: Record<string, string> = {
	income: colors.primary,
	expense: colors.rose,
};

const PlannedModal = () => {
	const router = useRouter();
	const params = useLocalSearchParams<{
		id?: string;
		type?: 'expense' | 'income';
		amount?: string;
		category?: string;
		dueDate?: string;
		isRecurring?: string;
		frequency?: 'monthly' | 'yearly';
	}>();
	const isEditMode = Boolean(params.id);

	const [type, setType] = useState<'expense' | 'income'>('expense');
	const [category, setCategory] = useState('');
	const [isRecurring, setIsRecurring] = useState(false);
	const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [amount, setAmount] = useState<number>(0);

	const [categoriesOptions, setCategoriesOptions] = useState<DropdownOption[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [deleting, setDeleting] = useState(false);

	useEffect(() => {
		fetchCategories();
	}, []);

	useEffect(() => {
		if (params.id) {
			if (params.type) setType(params.type);
			if (params.category) setCategory(params.category);
			if (params.amount) setAmount(parseFloat(params.amount) || 0);
			if (params.isRecurring) setIsRecurring(params.isRecurring === 'true');
			if (params.frequency) setFrequency(params.frequency);

			if (params.dueDate) {
				const [year, month, day] = params.dueDate.split('-').map(Number);
				if (year && month && day) {
					setDate(new Date(year, month - 1, day));
				}
			}
		} else {
			resetForm();
		}
	}, [params.id]);

	const resetForm = () => {
		setType('expense');
		setCategory('');
		setAmount(0);
		setIsRecurring(false);
		setFrequency('monthly');
		setDate(new Date());
	};

	const fetchCategories = async () => {
		const user = auth.currentUser;
		if (!user) {
			console.warn('User is not authenticated yet');
			return;
		}

		try {
			setLoadingCategories(true);
			const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
			const snapshot = await getDocs(q);
			let docs = snapshot.docs;
			if (docs.length === 0) {
				const defaultSnap = await getDocs(collection(db, 'categories'));
				docs = defaultSnap.docs;
			}
			const options: DropdownOption[] = docs
				.map((docSnap) => {
					const data = docSnap.data();
					const categoryName = data.name || data.label || '';
					return {
						label: categoryName,
						value: categoryName,
					};
				})
				.filter((opt) => opt.label !== '');
			setCategoriesOptions(options);
		} catch (error) {
			showMessage({
				message: 'Помилка',
				description: 'Помилка завантаження категорій',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setLoadingCategories(false);
		}
	};

	const handleSave = async () => {
		const user = auth.currentUser;
		if (!user) {
			showMessage({
				message: 'Помилка',
				description: 'Користувач не авторизований',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}

		if (type === 'expense' && !category) {
			showMessage({
				message: 'Помилка',
				description: 'Оберіть категорію',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}

		if (!amount || isNaN(amount) || amount <= 0) {
			showMessage({
				message: 'Помилка',
				description: 'Введіть коректну суму',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}

		const autoTitle = type === 'expense' ? category : 'Дохід';

		// Вспомогательная функция для форматирования даты в YYYY-MM-DD
		const formatDate = (targetDate: Date) => {
			const y = targetDate.getFullYear();
			const m = String(targetDate.getMonth() + 1).padStart(2, '0');
			const d = String(targetDate.getDate()).padStart(2, '0');
			return `${y}-${m}-${d}`;
		};

		try {
			setSubmitting(true);

			if (isEditMode && params.id) {
				// При редактировании обновляем только конкретную запись
				const formattedDate = formatDate(date);
				const payload: Omit<PlannedTransaction, 'id'> = {
					uid: user.uid,
					type,
					title: autoTitle,
					category: type === 'expense' ? category : '',
					amount,
					isRecurring,
					frequency: isRecurring ? frequency : 'monthly',
					dueDate: formattedDate,
				};

				const docRef = doc(db, 'planned_transactions', params.id);
				await updateDoc(docRef, {
					...payload,
					updatedAt: serverTimestamp(),
				});

				showMessage({
					message: 'Успіх',
					description: 'Платіж оновлено',
					type: 'success',
					backgroundColor: colors.gradientMid,
					color: colors.primary,
				});
			} else {
				// Создание новых записей
				if (isRecurring && frequency === 'monthly') {
					// Пакетная запись для 12 месяцев
					const batch = writeBatch(db);
					const collectionRef = collection(db, 'planned_transactions');

					const baseDay = date.getDate();

					for (let i = 0; i < 12; i++) {
						const nextDate = new Date(date.getFullYear(), date.getMonth() + i, 1);

						// Корректная обработка дней месяца (например, 31 число в феврале станет 28/29)
						const maxDaysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
						nextDate.setDate(Math.min(baseDay, maxDaysInMonth));

						const payload: Omit<PlannedTransaction, 'id'> = {
							uid: user.uid,
							type,
							title: autoTitle,
							category: type === 'expense' ? category : '',
							amount,
							isRecurring,
							frequency,
							dueDate: formatDate(nextDate),
						};

						const newDocRef = doc(collectionRef);
						batch.set(newDocRef, {
							...payload,
							createdAt: serverTimestamp(),
						});
					}

					await batch.commit();
				} else {
					// Разовый или ежегодный платіж
					const payload: Omit<PlannedTransaction, 'id'> = {
						uid: user.uid,
						type,
						title: autoTitle,
						category: type === 'expense' ? category : '',
						amount,
						isRecurring,
						frequency: isRecurring ? frequency : 'monthly',
						dueDate: formatDate(date),
					};

					await addDoc(collection(db, 'planned_transactions'), {
						...payload,
						createdAt: serverTimestamp(),
					});
				}

				showMessage({
					message: 'Успіх',
					description: isRecurring
						? 'Заплановані платежі створено на 12 місяців'
						: 'Запланований платіж збережено',
					type: 'success',
					backgroundColor: colors.gradientMid,
					color: colors.primary,
				});
			}

			router.back();
		} catch (error) {
			console.error('Помилка збереження запланованого платежу:', error);
			showMessage({
				message: 'Помилка',
				description: 'Транзакція не збереглась',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!params.id) return;

		setShowConfirmModal(false);

		try {
			setDeleting(true);
			await deleteDoc(doc(db, 'planned_transactions', params.id as string));
			showMessage({
				message: 'Успіх',
				description: 'Платіж видалено',
				type: 'success',
				backgroundColor: colors.gradientMid,
				color: colors.primary,
			});
			router.back();
		} catch (error) {
			console.error('Помилка видалення:', error);
			showMessage({
				message: 'Помилка',
				description: 'Не вдалося видалити платіж',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setDeleting(false);
		}
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
				<Header title={isEditMode ? 'Редагувати платіж' : 'Майбутній платіж'} leftIcon={<BackButton />} />

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={[globalStyles.modalForm, { paddingBottom: 40 }]}
					keyboardShouldPersistTaps="handled"
				>
					<View style={{ gap: 10 }}>
						<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
							Тип
						</Typo>
						<View style={globalStyles.modalBtnWrap}>
							{transactionTypes.map((item) => {
								const isActive = type === item.value;
								const activeTextColor = transactionColors[item.value] || colors.white;
								return (
									<Button key={item.value} onPress={() => setType(item.value)} style={{ flex: 1 }}>
										<Typo
											size={16}
											fontWeight={isActive ? '700' : '500'}
											color={isActive ? activeTextColor : colors.neutral400}
										>
											{item.label}
										</Typo>
									</Button>
								);
							})}
						</View>
					</View>

					{type === 'expense' && (
						<View style={{ gap: 10 }}>
							<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
								Категорія
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
												data={categoriesOptions}
												labelField="label"
												valueField="value"
												placeholder={'Оберіть категорію'}
												value={category}
												onChange={(item) => setCategory(item.value)}
											/>
										</LinearGradient>
									</Shadow>
								</Shadow>
							</View>
						</View>
					)}

					<View style={{ gap: 10, paddingHorizontal: 5 }}>
						<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
							Сума
						</Typo>
						<View style={globalStyles.modalInputContainer}>
							<Shadow {...SHADOW_INPUT.light} style={{ alignSelf: 'stretch' }}>
								<Shadow {...SHADOW_INPUT.dark} style={{ alignSelf: 'stretch' }}>
									<LinearGradient {...INPUT_GRADIENT} style={globalStyles.modalInputInner}>
										<Pressable
											style={globalStyles.modalInput}
											onPress={() => setShowCalcModal(true)}
										>
											<Typo size={14}>{amount === 0 ? 'Ввести суму' : `${amount}`}</Typo>
										</Pressable>
									</LinearGradient>
								</Shadow>
							</Shadow>
						</View>
					</View>

					<View style={{ gap: 12 }}>
						<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
							Регулярність
						</Typo>

						<View style={{ paddingHorizontal: 10 }}>
							<Shadow {...SHADOW_BLOCK.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
								<Shadow {...SHADOW_BLOCK.dark} style={{ alignSelf: 'stretch' }}>
									<View style={globalStyles.statSegmentWrap}>
										{['Разовий', 'Регулярний'].map((label, index) => {
											const isActive = index === 1 ? isRecurring : !isRecurring;
											return (
												<TouchableOpacity
													key={label}
													style={globalStyles.statSegmentBtn}
													onPress={() => setIsRecurring(index === 1)}
												>
													{isActive ? (
														<View style={globalStyles.statSegmentActive}>
															<Text
																style={{
																	color: colors.white,
																	fontWeight: '700',
																	fontSize: 13,
																}}
															>
																{label}
															</Text>
														</View>
													) : (
														<Text
															style={{
																color: colors.neutral400,
																textAlign: 'center',
																fontSize: 13,
															}}
														>
															{label}
														</Text>
													)}
												</TouchableOpacity>
											);
										})}
									</View>
								</Shadow>
							</Shadow>
						</View>

						{isRecurring && (
							<View style={{ paddingHorizontal: 10 }}>
								<Shadow {...SHADOW_BLOCK.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
									<Shadow {...SHADOW_BLOCK.dark} style={{ alignSelf: 'stretch' }}>
										<View style={globalStyles.statSegmentWrap}>
											{[
												{ label: 'Щомісячно', value: 'monthly' },
												{ label: 'Щорічно', value: 'yearly' },
											].map((item) => {
												const isActive = frequency === item.value;
												return (
													<TouchableOpacity
														key={item.value}
														style={globalStyles.statSegmentBtn}
														onPress={() => setFrequency(item.value as 'monthly' | 'yearly')}
														activeOpacity={0.7}
													>
														{isActive ? (
															<View style={globalStyles.statSegmentActive}>
																<Typo size={13} fontWeight="700" color={colors.white}>
																	{item.label}
																</Typo>
															</View>
														) : (
															<Typo
																size={13}
																color={colors.neutral400}
																style={{ textAlign: 'center' }}
															>
																{item.label}
															</Typo>
														)}
													</TouchableOpacity>
												);
											})}
										</View>
									</Shadow>
								</Shadow>
							</View>
						)}
					</View>

					<View style={{ gap: 10, paddingHorizontal: 5 }}>
						<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
							Дата
						</Typo>
						<View style={globalStyles.modalInputContainer}>
							<Shadow {...SHADOW_INPUT.light} style={{ alignSelf: 'stretch' }}>
								<Shadow {...SHADOW_INPUT.dark} style={{ alignSelf: 'stretch' }}>
									<LinearGradient {...INPUT_GRADIENT} style={globalStyles.modalInputInner}>
										<Pressable
											style={globalStyles.modalInput}
											onPress={() => setShowDatePicker(true)}
										>
											<Typo size={14}>{date.toLocaleDateString('uk-UA')}</Typo>
										</Pressable>
									</LinearGradient>
								</Shadow>
							</Shadow>
						</View>
					</View>
				</ScrollView>

				<View style={globalStyles.modalFooter}>
					{isEditMode ? (
						<View style={{ flexDirection: 'row', flex: 1 }}>
							<Button
								style={{ marginRight: 5 }}
								onPress={() => setShowConfirmModal(true)}
								disabled={deleting || submitting}
							>
								{deleting ? (
									<ActivityIndicator color={colors.rose} />
								) : (
									<Icons.Trash color={colors.rose} size={24} weight="bold" />
								)}
							</Button>
							<Button style={{ flex: 1 }} onPress={handleSave} disabled={submitting || deleting}>
								{submitting ? (
									<ActivityIndicator color={colors.primaryLight} />
								) : (
									<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
										Редагувати
									</Typo>
								)}
							</Button>
						</View>
					) : (
						<Button style={{ flex: 1 }} onPress={handleSave} disabled={submitting}>
							{submitting ? (
								<ActivityIndicator color={colors.primaryLight} />
							) : (
								<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
									Створити
								</Typo>
							)}
						</Button>
					)}
				</View>
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

			<CustomDatePickerModal
				isVisible={showDatePicker}
				initialDate={date}
				onClose={() => setShowDatePicker(false)}
				onSelectDate={(newDate: Date) => {
					setDate(newDate);
					setShowDatePicker(false);
				}}
			/>

			<ConfirmModal
				visible={showConfirmModal}
				title="Видалення платежу"
				message={'Ви впевнені, що хочете видалити цей запланований платіж?'}
				confirmText="Видалити"
				cancelText="Скасувати"
				onConfirm={handleDelete}
				onCancel={() => {
					setShowConfirmModal(false);
				}}
			/>
		</ModalWrapper>
	);
};

export default PlannedModal;
