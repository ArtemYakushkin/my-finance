import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import CalculatorModal from '@/components/CalculatorModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import CustomDatePickerModal from '@/components/CustomDatePickerModal';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { auth, db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { PlannedTransaction } from '@/constants/types';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/showToast';
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
import { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CategoryOption {
	label: string;
	value: string;
	icon?: React.ComponentType<any>;
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
	const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);

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
			showWarningToast('Користувач ще не автентифікований');
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
			const options: CategoryOption[] = docs
				.map((docSnap) => {
					const data = docSnap.data();
					const categoryName = data.name || data.label || '';
					const iconName = data.icon || 'Tag';
					const IconComponent = (Icons as Record<string, any>)[iconName] || Icons.Tag;
					return {
						label: categoryName,
						value: categoryName,
						icon: IconComponent,
					};
				})
				.filter((opt) => opt.label !== '');
			setCategoriesOptions(options);
		} catch (error) {
			showErrorToast('Помилка завантаження категорій');
		} finally {
			setLoadingCategories(false);
		}
	};

	const handleTypeChange = (newType: 'expense' | 'income') => {
		setType(newType);
		if (newType === 'income') {
			setCategory('');
		}
	};

	const formatDate = (targetDate: Date) => {
		const y = targetDate.getFullYear();
		const m = String(targetDate.getMonth() + 1).padStart(2, '0');
		const d = String(targetDate.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};

	const handleSave = async () => {
		const user = auth.currentUser;
		if (!user) {
			showErrorToast('Користувач не авторизований');
			return;
		}

		if (type === 'expense' && !category) {
			showWarningToast('Оберіть категорію');
			return;
		}

		if (!amount || isNaN(amount) || amount <= 0) {
			showWarningToast('Введіть коректну суму');
			return;
		}

		const autoTitle = type === 'expense' ? category : 'Дохід';

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

				showSuccessToast('Платіж оновлено');
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

				showSuccessToast(
					isRecurring ? 'Заплановані платежі створено на 12 місяців' : 'Запланований платіж збережено',
				);
			}

			router.back();
		} catch (error) {
			showErrorToast('Транзакція не збереглась');
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
			showSuccessToast('Платіж видалено');
			router.back();
		} catch (error) {
			showErrorToast('Не вдалося видалити платіж');
		} finally {
			setDeleting(false);
		}
	};

	const sortedCategoriesOptions = useMemo(() => {
		if (!category) return categoriesOptions;

		const selectedItem = categoriesOptions.find((item) => item.value === category);
		if (!selectedItem) return categoriesOptions;

		const filtered = categoriesOptions.filter((item) => item.value !== category);
		return [selectedItem, ...filtered];
	}, [categoriesOptions, category]);

	const visibleCategoriesOptions = isExpanded ? sortedCategoriesOptions : sortedCategoriesOptions.slice(0, 8);

	const handleSelectCategory = (value: string) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setCategory(value);
		setIsExpanded(false);
	};

	const toggleExpand = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setIsExpanded(!isExpanded);
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={isEditMode ? 'Редагувати платіж' : 'Майбутній платіж'} leftIcon={<BackButton />} />

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={[globalStyles.modalForm, { paddingBottom: 140 }]}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					automaticallyAdjustKeyboardInsets={true}
				>
					<View style={{ gap: 10 }}>
						<Typo color={colors.neutral200} size={16}>
							Тип
						</Typo>
						<View style={{ width: '100%' }}>
							<View style={globalStyles.statSegmentWrap}>
								{transactionTypes.map((item) => {
									const isActive = type === item.value;
									const activeTextColor = transactionColors[item.value] || colors.white;
									return (
										<TouchableOpacity
											key={item.value}
											style={globalStyles.statSegmentBtn}
											onPress={() => handleTypeChange(item.value as 'expense' | 'income')}
										>
											{isActive ? (
												<View style={globalStyles.statSegmentActive}>
													<Typo size={16} fontWeight={'500'} color={activeTextColor}>
														{item.label}
													</Typo>
												</View>
											) : (
												<Typo
													size={16}
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
						</View>
					</View>

					{type === 'expense' && (
						<View style={{ gap: 10 }}>
							<Typo color={colors.neutral200} size={16}>
								Категорія витрат
							</Typo>
							{loadingCategories ? (
								<Loading />
							) : (
								<View style={{ gap: 10 }}>
									<View style={globalStyles.transCatContainer}>
										{visibleCategoriesOptions.map((item) => {
											const isSelected = category === item.value;
											const IconComponent = item.icon;
											return (
												<TouchableOpacity
													key={item.value}
													onPress={() => handleSelectCategory(item.value)}
													style={globalStyles.transCatItem}
												>
													<View
														style={[
															globalStyles.transCatIcon,
															isSelected && { borderColor: colors.primaryLight },
														]}
													>
														{IconComponent ? (
															<IconComponent
																size={24}
																color={
																	isSelected ? colors.primaryLight : colors.neutral400
																}
															/>
														) : null}
													</View>
													<Typo
														size={13}
														fontWeight={500}
														color={isSelected ? colors.primaryLight : colors.neutral400}
														style={{ textAlign: 'center' }}
													>
														{item.label}
													</Typo>
												</TouchableOpacity>
											);
										})}
									</View>

									{sortedCategoriesOptions.length > 8 && (
										<TouchableOpacity
											onPress={toggleExpand}
											style={globalStyles.transCatExpandButton}
										>
											<Typo color={colors.primaryLight} size={14} fontWeight={600}>
												{isExpanded ? 'Згорнути' : `Ще (${sortedCategoriesOptions.length - 8})`}
											</Typo>
											{isExpanded ? (
												<Icons.CaretUp color={colors.primaryLight} size={18} />
											) : (
												<Icons.CaretDown color={colors.primaryLight} size={18} />
											)}
										</TouchableOpacity>
									)}
								</View>
							)}
						</View>
					)}

					<View style={{ gap: 10 }}>
						<Typo color={colors.neutral200} size={16}>
							Регулярність
						</Typo>

						<View style={{ width: '100%' }}>
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
													<Typo size={16} fontWeight={'500'} color={colors.neutral200}>
														{label}
													</Typo>
												</View>
											) : (
												<Typo
													size={16}
													color={colors.neutral400}
													style={{ textAlign: 'center' }}
												>
													{label}
												</Typo>
											)}
										</TouchableOpacity>
									);
								})}
							</View>
						</View>

						{isRecurring && (
							<View style={{ width: '100%' }}>
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
											>
												{isActive ? (
													<View style={globalStyles.statSegmentActive}>
														<Typo size={16} fontWeight={'500'} color={colors.neutral200}>
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
							</View>
						)}
					</View>

					<View style={{ flexDirection: 'row', gap: 10 }}>
						<View style={{ gap: 10, flex: 1 }}>
							<Typo color={colors.neutral200} size={16}>
								Дата
							</Typo>
							<View style={globalStyles.modalInputContainer}>
								<View style={globalStyles.modalInputInner}>
									<Pressable style={globalStyles.modalInput} onPress={() => setShowDatePicker(true)}>
										<Typo size={14}>{date.toLocaleDateString('uk-UA')}</Typo>
									</Pressable>
								</View>
							</View>
						</View>

						<View style={{ gap: 10, flex: 1 }}>
							<Typo color={colors.neutral200} size={16}>
								Сума
							</Typo>
							<View style={globalStyles.modalInputContainer}>
								<View style={globalStyles.modalInputInner}>
									<Pressable style={globalStyles.modalInput} onPress={() => setShowCalcModal(true)}>
										<Typo size={14}>{amount === 0 ? 'Ввести суму' : `${amount}`}</Typo>
									</Pressable>
								</View>
							</View>
						</View>
					</View>
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				{isEditMode ? (
					<View style={{ flexDirection: 'row', flex: 1 }}>
						<Button
							style={{ marginRight: 5, flex: 0.2 }}
							onPress={() => setShowConfirmModal(true)}
							disabled={deleting || submitting}
						>
							{deleting ? <Loading /> : <Icons.Trash color={colors.rose} size={24} weight="bold" />}
						</Button>
						<Button style={{ flex: 1 }} onPress={handleSave} disabled={submitting || deleting}>
							{submitting ? (
								<Loading />
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
							<Loading />
						) : (
							<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
								Створити
							</Typo>
						)}
					</Button>
				)}
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
