import { FormRefActions } from '@/app/(modals)/transactionModal';
import { db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { showErrorToast, showWarningToast } from '@/utils/showToast';
import { useRouter } from 'expo-router';
import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
	Dimensions,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	ScrollView,
	TouchableOpacity,
	View,
} from 'react-native';
import CalculatorModal from './CalculatorModal';
import CustomDatePickerModal from './CustomDatePickerModal';
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

// Расчет геометрии для горизонтального списка кошельков
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const GAP = 12;
const VISIBLE_ITEMS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * (VISIBLE_ITEMS - 1)) / VISIBLE_ITEMS;

const TransferForm = forwardRef<FormRefActions, Props>(({ wallets, setLoading, oldData }, ref) => {
	const { user } = useAuth();
	const router = useRouter();

	const [amount, setAmount] = useState<number>(oldData?.amount || 0);
	const [fromWallet, setFromWallet] = useState<string>(oldData?.fromWalletId || '');
	const [toWallet, setToWallet] = useState<string>(oldData?.toWalletId || '');
	const [description, setDescription] = useState<string>(oldData?.description || '');
	const [date, setDate] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);
	const [scrollOffset, setScrollOffset] = useState(0);
	const [contentWidth, setContentWidth] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);

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
			setAmount(0);
			setFromWallet('');
			setToWallet('');
			setDescription('');
			setDate(new Date());
		}
	}, [oldData]);

	const destinationWallets = useMemo(() => {
		if (!fromWallet) return wallets;
		return wallets.filter((w) => String(w.value) !== String(fromWallet));
	}, [wallets, fromWallet]);

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
			showWarningToast('Виберіть обидва гаманці для переказу');
			return;
		}

		if (fromWallet === toWallet) {
			showWarningToast('Рахунок списання та зарахування не можуть збігатися');
			return;
		}

		if (isNaN(parsedAmount) || parsedAmount <= 0) {
			showWarningToast('Введіть коректну суму переказу');
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
					showWarningToast('Недостатньо коштів на гаманці-відправнику');
					return;
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
			showErrorToast(error.message || 'Не вдалося виконати переказ');
		} finally {
			setLoading(false);
		}
	};

	useImperativeHandle(ref, () => ({
		submit: () => {
			handleSubmit();
		},
	}));

	// Расчет кастомного скроллбара
	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		setScrollOffset(event.nativeEvent.contentOffset.x);
	};
	const maxScroll = contentWidth - containerWidth;
	const showScrollbar = wallets.length > VISIBLE_ITEMS && maxScroll > 0;
	const scrollbarTrackWidth = 60;
	const scrollbarThumbWidth = Math.max(18, (containerWidth / (contentWidth || 1)) * scrollbarTrackWidth);
	const thumbMaxTravel = scrollbarTrackWidth - scrollbarThumbWidth;
	const thumbPosition = maxScroll > 0 ? (scrollOffset / maxScroll) * thumbMaxTravel : 0;

	return (
		<View style={{ gap: 20 }}>
			{/*Кошелек списания*/}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16}>
					Звідки (Рахунок списання)
				</Typo>
				<View style={{ gap: 6 }}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						onScroll={handleScroll}
						scrollEventThrottle={16}
						onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
						onContentSizeChange={(w) => setContentWidth(w)}
						contentContainerStyle={{ gap: GAP }}
					>
						{wallets.map((wallet) => {
							const isSelected = fromWallet === wallet.value;
							const match = wallet.label.match(/^(.*?)\s*(\(.*\))?$/);
							const walletName = match?.[1] || wallet.label;
							const walletBalance = match?.[2] || '';

							return (
								<TouchableOpacity
									key={wallet.value}
									onPress={() => setFromWallet(wallet.value)}
									style={{ alignItems: 'center', width: ITEM_WIDTH }}
								>
									<View
										style={[
											globalStyles.transWalletItem,
											isSelected && {
												borderColor: colors.primaryLight,
												backgroundColor: colors.gradientStart,
											},
										]}
									>
										<View style={{ alignItems: 'center' }}>
											<Typo
												size={13}
												fontWeight={500}
												color={isSelected ? colors.neutral200 : colors.neutral400}
											>
												{walletName}
											</Typo>
											<Typo
												size={13}
												fontWeight={500}
												color={isSelected ? colors.neutral200 : colors.neutral400}
											>
												{walletBalance}
											</Typo>
										</View>
									</View>
								</TouchableOpacity>
							);
						})}
					</ScrollView>

					{showScrollbar && (
						<View style={globalStyles.transWalletScrollBar}>
							<View
								style={[
									{ height: '100%', backgroundColor: colors.neutral500, borderRadius: 2 },
									{
										width: scrollbarThumbWidth,
										transform: [{ translateX: thumbPosition }],
									},
								]}
							/>
						</View>
					)}
				</View>
			</View>

			{/*Кошелек зачисления*/}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16}>
					Куди (Рахунок зарахування)
				</Typo>
				<View style={{ gap: 6 }}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						onScroll={handleScroll}
						scrollEventThrottle={16}
						onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
						onContentSizeChange={(w) => setContentWidth(w)}
						contentContainerStyle={{ gap: GAP }}
					>
						{wallets.map((wallet) => {
							const isSelected = toWallet === wallet.value;
							const match = wallet.label.match(/^(.*?)\s*(\(.*\))?$/);
							const walletName = match?.[1] || wallet.label;
							const walletBalance = match?.[2] || '';

							return (
								<TouchableOpacity
									key={wallet.value}
									onPress={() => setToWallet(wallet.value)}
									style={{ alignItems: 'center', width: ITEM_WIDTH }}
								>
									<View
										style={[
											globalStyles.transWalletItem,
											isSelected && {
												borderColor: colors.primaryLight,
												backgroundColor: colors.gradientStart,
											},
										]}
									>
										<View style={{ alignItems: 'center' }}>
											<Typo
												size={13}
												fontWeight={500}
												color={isSelected ? colors.neutral200 : colors.neutral400}
											>
												{walletName}
											</Typo>
											<Typo
												size={13}
												fontWeight={500}
												color={isSelected ? colors.neutral200 : colors.neutral400}
											>
												{walletBalance}
											</Typo>
										</View>
									</View>
								</TouchableOpacity>
							);
						})}
					</ScrollView>

					{showScrollbar && (
						<View style={globalStyles.transWalletScrollBar}>
							<View
								style={[
									{ height: '100%', backgroundColor: colors.neutral500, borderRadius: 2 },
									{
										width: scrollbarThumbWidth,
										transform: [{ translateX: thumbPosition }],
									},
								]}
							/>
						</View>
					)}
				</View>
			</View>

			<View style={{ flexDirection: 'row', gap: 10 }}>
				{/*Дата*/}
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

				{/*Сумма*/}
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

			{/*Описание*/}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16}>
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

			<CustomDatePickerModal
				isVisible={showDatePicker}
				initialDate={date}
				onClose={() => setShowDatePicker(false)}
				onSelectDate={(newDate: Date) => {
					setDate(newDate);
					setShowDatePicker(false);
				}}
			/>
		</View>
	);
});

TransferForm.displayName = 'TransferForm';

export default TransferForm;
