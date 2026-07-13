import { FormRefActions } from '@/app/(tabs)/transaction';
import { db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT, INPUT_GRADIENT } from '@/constants/gradient';
import { SHADOW_DROPDOWN, SHADOW_INPUT } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Shadow } from 'react-native-shadow-2';
import CalculatorModal from './CalculatorModal';
import Input from './Input';
import Typo from './Typo';

type DropdownItem = {
	label: string;
	value: string;
};

type Props = {
	wallets: DropdownItem[];
	setLoading: (loading: boolean) => void;
	oldData?: any;
};

const TransferForm = forwardRef<FormRefActions, Props>(({ wallets, setLoading, oldData }, ref) => {
	const { user } = useAuth();
	const router = useRouter();

	// Первичная инициализация стейта напрямую из oldData
	const [amount, setAmount] = useState<number>(oldData?.amount || 0);
	const [fromWallet, setFromWallet] = useState<string>(oldData?.fromWalletId || '');
	const [toWallet, setToWallet] = useState<string>(oldData?.toWalletId || '');
	const [description, setDescription] = useState<string>(oldData?.description || '');
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);

	// Синхронизация данных при изменении oldData (редактирование)
	useEffect(() => {
		if (oldData) {
			setAmount(Number(oldData.amount || 0));
			setFromWallet(oldData.fromWalletId || '');
			setToWallet(oldData.toWalletId || '');
			setDescription(oldData.description || '');

			if (oldData.date) {
				if (oldData.date.seconds) {
					setDate(new Date(oldData.date.seconds * 1000));
				} else {
					setDate(new Date(oldData.date));
				}
			}
		} else {
			// Если создаем новый перевод — сбрасываем в дефолт
			setAmount(0);
			setFromWallet('');
			setToWallet('');
			setDescription('');
			setDate(new Date());
		}
	}, [oldData]);

	// Оптимизируем фильтрацию через useMemo
	const destinationWallets = useMemo(() => {
		if (!fromWallet) return wallets;
		return wallets.filter((w) => String(w.value) !== String(fromWallet));
	}, [wallets, fromWallet]);

	const handleDateChange = (event: any, selectedDate?: Date) => {
		if (Platform.OS === 'android') {
			setShowDatePicker(false);
		}
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	const resetForm = () => {
		setAmount(0);
		setFromWallet('');
		setToWallet('');
		setDescription('');
		setDate(new Date());
	};

	const handleSubmit = async () => {
		const parsedAmount = amount;

		if (!fromWallet || !toWallet) {
			Alert.alert('Помилка', 'Виберіть обидва гаманці для переказу');
			return;
		}
		if (fromWallet === toWallet) {
			Alert.alert('Помилка', 'Рахунок списання та зарахування не можуть збігатися');
			return;
		}
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			Alert.alert('Помилка', 'Введіть коректну суму переказу');
			return;
		}
		if (!user?.uid) return;

		setLoading(true);

		try {
			await runTransaction(db, async (transaction) => {
				const fromWalletRef = doc(db, 'wallets', fromWallet);
				const toWalletRef = doc(db, 'wallets', toWallet);

				const fromWalletDoc = await transaction.get(fromWalletRef);
				const toWalletDoc = await transaction.get(toWalletRef);

				if (!fromWalletDoc.exists() || !toWalletDoc.exists()) {
					throw new Error('Один із гаманців не знайдено в базі даних');
				}

				let fromBalance = Number(fromWalletDoc.data().amount || 0);
				let toBalance = Number(toWalletDoc.data().amount || 0);

				// Если это РЕДАКТИРОВАНИЕ, возвращаем старые балансы назад
				if (oldData?.id) {
					const oldAmount = Number(oldData.amount || 0);

					if (oldData.fromWalletId === fromWallet && oldData.toWalletId === toWallet) {
						fromBalance += oldAmount;
						toBalance -= oldAmount;
					} else {
						const oldFromWalletRef = doc(db, 'wallets', oldData.fromWalletId);
						const oldToWalletRef = doc(db, 'wallets', oldData.toWalletId);

						const oldFromDoc = await transaction.get(oldFromWalletRef);
						const oldToDoc = await transaction.get(oldToWalletRef);

						if (oldFromDoc.exists()) {
							transaction.update(oldFromWalletRef, {
								amount: Number(oldFromDoc.data().amount || 0) + oldAmount,
							});
						}
						if (oldToDoc.exists()) {
							transaction.update(oldToWalletRef, {
								amount: Number(oldToDoc.data().amount || 0) - oldAmount,
							});
						}

						if (oldData.fromWalletId === fromWallet) fromBalance += oldAmount;
						if (oldData.toWalletId === fromWallet) fromBalance -= oldAmount;
						if (oldData.fromWalletId === toWallet) toBalance += oldAmount;
						if (oldData.toWalletId === toWallet) toBalance -= oldAmount;
					}
				}

				if (fromBalance < parsedAmount) {
					throw new Error('Недостатньо коштів на гаманці-відправнику');
				}

				transaction.update(fromWalletRef, { amount: fromBalance - parsedAmount });
				transaction.update(toWalletRef, { amount: toBalance + parsedAmount });

				if (oldData?.id) {
					const txRef = doc(db, 'transactions', oldData.id);
					transaction.update(txRef, {
						type: 'transfer',
						amount: parsedAmount,
						fromWalletId: fromWallet,
						toWalletId: toWallet,
						description: description.trim() || 'Переказ між рахунками',
						date: Timestamp.fromDate(date),
					});
				} else {
					const transactionsRef = collection(db, 'transactions');
					transaction.set(doc(transactionsRef), {
						uid: user.uid,
						type: 'transfer',
						amount: parsedAmount,
						fromWalletId: fromWallet,
						toWalletId: toWallet,
						description: description.trim() || 'Переказ між рахунками',
						date: Timestamp.fromDate(date),
					});
				}
			});

			resetForm();
			router.replace('/(tabs)');
		} catch (error: any) {
			console.error('Помилка при переказі: ', error);
			Alert.alert('Помилка', error.message || 'Не вдалося виконати переказ');
		} finally {
			setLoading(false);
		}
	};

	// Экспортируем метод submit наружу через ref
	useImperativeHandle(ref, () => ({
		submit: () => {
			handleSubmit();
		},
	}));

	return (
		<View style={{ gap: 20, paddingBottom: 40 }}>
			{/* Звідки */}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
					Звідки (Рахунок списання)
				</Typo>
				<View style={globalStyles.modalDropdownShadowHolder}>
					<Shadow {...SHADOW_DROPDOWN.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
						<Shadow {...SHADOW_DROPDOWN.dark} style={{ alignSelf: 'stretch' }}>
							<LinearGradient
								{...(BUTTON_GRADIENT as any)}
								style={{ borderRadius: 17, overflow: 'hidden', height: 56, justifyContent: 'center' }}
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
									value={fromWallet}
									onChange={(item) => {
										setFromWallet(item.value);
										if (item.value === toWallet) setToWallet('');
									}}
								/>
							</LinearGradient>
						</Shadow>
					</Shadow>
				</View>
			</View>

			{/* Куди */}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
					Куди (Рахунок зарахування)
				</Typo>
				<View style={globalStyles.modalDropdownShadowHolder}>
					<Shadow {...SHADOW_DROPDOWN.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
						<Shadow {...SHADOW_DROPDOWN.dark} style={{ alignSelf: 'stretch' }}>
							<LinearGradient
								{...(BUTTON_GRADIENT as any)}
								style={{ borderRadius: 17, overflow: 'hidden', height: 56, justifyContent: 'center' }}
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
									data={destinationWallets}
									labelField="label"
									valueField="value"
									placeholder={'Вибрати гаманець'}
									value={toWallet}
									onChange={(item) => setToWallet(item.value)}
								/>
							</LinearGradient>
						</Shadow>
					</Shadow>
				</View>
			</View>

			{/* Дата */}
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

			{/* Сума */}
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

			{/* Опис */}
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

TransferForm.displayName = 'TransferForm';

export default TransferForm;
