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
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Alert, Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Shadow } from 'react-native-shadow-2';
import CalculatorModal from './CalculatorModal';
import Input from './Input';
import Typo from './Typo';

type Props = {
	wallets: { label: string; value: string }[];
	setLoading: (loading: boolean) => void;
	oldData?: any;
};

const IncomeForm = forwardRef<FormRefActions, Props>(({ wallets, setLoading, oldData }, ref) => {
	const { user } = useAuth();
	const router = useRouter();

	// Инициализируем стейт сразу из oldData, если они есть
	const [walletId, setWalletId] = useState(oldData?.walletId || '');
	const [date, setDate] = useState(new Date());
	const [amount, setAmount] = useState<number>(oldData?.amount || 0);
	const [description, setDescription] = useState(oldData?.description || '');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);

	const resetForm = () => {
		setWalletId('');
		setDate(new Date());
		setAmount(0);
		setDescription('');
	};

	// Синхронизация стейта при редактировании или создании новой транзакции
	useEffect(() => {
		if (oldData) {
			setWalletId(oldData.walletId || '');
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
			setDate(new Date());
			setAmount(0);
			setDescription('');
		}
	}, [oldData]);

	// Безопасное прокидывание метода submit наружу через useImperativeHandle
	useImperativeHandle(ref, () => ({
		submit: () => {
			handleSaveIncome();
		},
	}));

	const handleDateChange = (event: any, selectedDate?: Date) => {
		if (Platform.OS === 'android') {
			setShowDatePicker(false);
		}
		if (selectedDate) {
			setDate(selectedDate);
		}
	};

	const handleSaveIncome = async () => {
		if (!user?.uid) return;
		if (!walletId) return Alert.alert('Помилка', 'Виберіть гаманець зарахування');
		if (amount <= 0) return Alert.alert('Помилка', 'Сума повинна бути більша за 0');

		try {
			setLoading(true);

			const transactionPayload = {
				uid: user.uid,
				type: 'income' as const,
				amount,
				walletId,
				date,
				description: description.trim(),
			};

			if (oldData?.id) {
				await transactionService.updateTransaction(oldData.id, transactionPayload, oldData);
			} else {
				await transactionService.createTransaction(transactionPayload);
			}

			resetForm();
			router.replace('/(tabs)');
		} catch (error: any) {
			Alert.alert('Помилка', error.message || 'Щось пішло не так');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={{ gap: 20, paddingBottom: 40 }}>
			{/* Гаманець зарахування */}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
					Гаманець зарахування
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
									<Typo size={14}>{amount === 0 ? 'Ввести суму' : `${amount} ₴`}</Typo>
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

IncomeForm.displayName = 'IncomeForm';

export default IncomeForm;
