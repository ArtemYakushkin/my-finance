import { FormRefActions } from '@/app/(modals)/transactionModal';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { transactionService } from '@/services/transactionService';
import { showErrorToast, showWarningToast } from '@/utils/showToast';
import { useRouter } from 'expo-router';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
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

type Props = {
	wallets: { label: string; value: string }[];
	setLoading: (loading: boolean) => void;
	oldData?: any;
};

// Расчет геометрии для горизонтального списка кошельков
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const GAP = 12;
const VISIBLE_ITEMS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * (VISIBLE_ITEMS - 1)) / VISIBLE_ITEMS;

const IncomeForm = forwardRef<FormRefActions, Props>(({ wallets, setLoading, oldData }, ref) => {
	const { user } = useAuth();
	const router = useRouter();

	const [walletId, setWalletId] = useState(oldData?.walletId || '');
	const [date, setDate] = useState(new Date());
	const [amount, setAmount] = useState<number>(oldData?.amount || 0);
	const [description, setDescription] = useState(oldData?.description || '');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);
	const [scrollOffset, setScrollOffset] = useState(0);
	const [contentWidth, setContentWidth] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const resetForm = () => {
		setWalletId('');
		setDate(new Date());
		setAmount(0);
		setDescription('');
	};

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

	useImperativeHandle(ref, () => ({
		submit: () => {
			handleSaveIncome();
		},
	}));

	const handleSaveIncome = async () => {
		if (!user?.uid) return;
		if (!walletId) {
			showWarningToast('Виберіть гаманець зарахування');
			return;
		}

		if (amount <= 0) {
			showWarningToast('Сума повинна бути більша за 0');
			return;
		}

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
			showErrorToast(error.message || 'Щось пішло не так');
		} finally {
			setLoading(false);
		}
	};

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
			{/* Выбор кошелька*/}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16}>
					Гаманець зарахування
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
							const isSelected = walletId === wallet.value;
							const match = wallet.label.match(/^(.*?)\s*(\(.*\))?$/);
							const walletName = match?.[1] || wallet.label;
							const walletBalance = match?.[2] || '';

							return (
								<TouchableOpacity
									key={wallet.value}
									onPress={() => setWalletId(wallet.value)}
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
								<Typo size={14} color={colors.neutral100}>
									{date.toLocaleDateString('uk-UA')}
								</Typo>
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
								<Typo size={14} color={colors.neutral100}>
									{amount === 0 ? 'Ввести суму' : `${amount}`}
								</Typo>
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

IncomeForm.displayName = 'IncomeForm';

export default IncomeForm;
