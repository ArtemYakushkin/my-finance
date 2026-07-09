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
import { RefObject, useImperativeHandle, useState } from 'react';
import { Alert, Platform, Pressable, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Shadow } from 'react-native-shadow-2';
import CalculatorModal from './CalculatorModal';
import Input from './Input';
import Typo from './Typo';

type Props = {
	wallets: { label: string; value: string }[];
	setLoading: (loading: boolean) => void;
	ref: RefObject<FormRefActions | null>; // Передаем реф как обычный проп
};

const IncomeForm = ({ wallets, setLoading, ref }: Props) => {
	const { user } = useAuth();
	const router = useRouter();

	// Внутренние стейты формы доходов
	const [walletId, setWalletId] = useState('');
	const [date, setDate] = useState(new Date());
	const [amount, setAmount] = useState<number>(0);
	const [description, setDescription] = useState('');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);

	// Прокидываем метод submit в родительский компонент transaction.tsx
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

	const resetForm = () => {
		setWalletId('');
		setDate(new Date());
		setAmount(0);
		setDescription('');
	};

	const handleSaveIncome = async () => {
		if (!user?.uid) return;
		if (!walletId) return Alert.alert('Помилка', 'Виберіть гаманець зарахування');
		if (amount <= 0) return Alert.alert('Помилка', 'Сума повинна бути більша за 0');

		try {
			setLoading(true);
			await transactionService.createTransaction({
				uid: user.uid,
				type: 'income', // Важно: тип теперь income!
				amount,
				walletId,
				date,
				description: description.trim(),
			});
			resetForm();
			router.back();
		} catch (error: any) {
			Alert.alert('Помилка', error.message || 'Щось пішло не так');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={{ gap: 20, paddingBottom: 40 }}>
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
};

export default IncomeForm;
