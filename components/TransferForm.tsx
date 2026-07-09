import { FormRefActions } from '@/app/(tabs)/transaction';
import { db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT, INPUT_GRADIENT } from '@/constants/gradient';
import { SHADOW_DROPDOWN, SHADOW_INPUT } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { RefObject, useImperativeHandle, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
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
	ref: RefObject<FormRefActions | null>;
};

const TransferForm = ({ wallets, setLoading, ref }: Props) => {
	const { user } = useAuth();
	const router = useRouter();

	const [amount, setAmount] = useState<number>(0);
	const [fromWallet, setFromWallet] = useState<string>('');
	const [toWallet, setToWallet] = useState<string>('');
	const [description, setDescription] = useState<string>('');
	const [showCalcModal, setShowCalcModal] = useState(false);

	// Фильтруем кошельки для получения ("Куди"), чтобы исключить уже выбранный кошелек "Звідки"
	const destinationWallets = wallets.filter((w) => w.value !== fromWallet);

	const handleSubmit = async () => {
		const parsedAmount = amount;

		if (!fromWallet || !toWallet) {
			Alert.alert('Помилка', 'Виберіть обидва гаманці для переказу');
			return;
		}
		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			Alert.alert('Помилка', 'Введіть коректну суму переказу');
			return;
		}
		if (!user?.uid) return;

		setLoading(true);

		try {
			// Используем Firestore Transaction, чтобы атомарно обновить балансы обоих кошельков и создать лог транзакции
			await runTransaction(db, async (transaction) => {
				const fromWalletRef = doc(db, 'wallets', fromWallet);
				const toWalletRef = doc(db, 'wallets', toWallet);

				const fromWalletDoc = await transaction.get(fromWalletRef);
				const toWalletDoc = await transaction.get(toWalletRef);

				if (!fromWalletDoc.exists() || !toWalletDoc.exists()) {
					throw new Error('Один із гаманців не знайдено в базі даних');
				}

				const fromBalance = fromWalletDoc.data().amount || 0;
				const toBalance = toWalletDoc.data().amount || 0;

				if (fromBalance < parsedAmount) {
					throw new Error('Недостатньо коштів на гаманці-відправнику');
				}

				// 1. Списываем у отправителя
				transaction.update(fromWalletRef, { amount: fromBalance - parsedAmount });

				// 2. Начисляем получателю
				transaction.update(toWalletRef, { amount: toBalance + parsedAmount });

				// 3. Создаем запись о транзакции перевода
				const transactionsRef = collection(db, 'transactions');
				transaction.set(doc(transactionsRef), {
					uid: user.uid,
					type: 'transfer',
					amount: parsedAmount,
					fromWalletId: fromWallet,
					toWalletId: toWallet,
					description: description.trim() || 'Переказ між рахунками',
					date: serverTimestamp(),
				});
			});

			// Сбрасываем форму при успешном переводе
			setAmount(0);
			setFromWallet('');
			setToWallet('');
			setDescription('');

			router.back();
		} catch (error: any) {
			console.error('Помилка при переказі: ', error);
			Alert.alert('Помилка', error.message || 'Не вдалося виконати переказ');
		} finally {
			setLoading(false);
		}
	};

	// Прокидываем метод submit в родительский компонент Transaction
	useImperativeHandle(ref, () => ({
		submit: handleMainSubmit,
	}));

	const handleMainSubmit = () => {
		handleSubmit();
	};

	return (
		<View style={{ gap: 20, paddingBottom: 40 }}>
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
					Звідки (Рахунок списання)
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
									value={fromWallet}
									onChange={(item) => {
										setFromWallet(item.value);
										if (item.value === toWallet) setToWallet(''); // Сбрасываем "Куда", если совпали
									}}
								/>
							</LinearGradient>
						</Shadow>
					</Shadow>
				</View>
			</View>

			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
					Куди (Рахунок зарахування)
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

export default TransferForm;
