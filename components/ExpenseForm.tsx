import { FormRefActions } from '@/app/(modals)/transactionModal';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { transactionService } from '@/services/transactionService';
import { showErrorToast, showWarningToast } from '@/utils/showToast';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
	Dimensions,
	LayoutAnimation,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	Pressable,
	ScrollView,
	TouchableOpacity,
	UIManager,
	View,
} from 'react-native';
import CalculatorModal from './CalculatorModal';
import CustomDatePickerModal from './CustomDatePickerModal';
import Input from './Input';
import Typo from './Typo';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CategoryItem = {
	label: string;
	value: string;
	group: string;
	type: 'expense' | 'income';
	icon?: React.ComponentType<any>;
};

type Props = {
	wallets: { label: string; value: string }[];
	categories: CategoryItem[];
	setLoading: (loading: boolean) => void;
	oldData?: any;
};

// Расчет геометрии для горизонтального списка кошельков
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 16;
const GAP = 12;
const VISIBLE_ITEMS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP * (VISIBLE_ITEMS - 1)) / VISIBLE_ITEMS;

const ExpenseForm = forwardRef<FormRefActions, Props>(({ wallets, categories = [], setLoading, oldData }, ref) => {
	const { user } = useAuth();
	const router = useRouter();

	const [walletId, setWalletId] = useState(oldData?.walletId || '');
	const [subCategory, setSubCategory] = useState(oldData?.category || '');
	const [date, setDate] = useState(new Date());
	const [amount, setAmount] = useState<number>(oldData?.amount || 0);
	const [description, setDescription] = useState(oldData?.description || '');
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showCalcModal, setShowCalcModal] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [scrollOffset, setScrollOffset] = useState(0);
	const [contentWidth, setContentWidth] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const resetForm = () => {
		setWalletId('');
		setSubCategory('');
		setDate(new Date());
		setAmount(0);
		setDescription('');
		setIsExpanded(false);
	};

	useEffect(() => {
		if (oldData) {
			setWalletId(oldData.walletId || '');
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
			resetForm();
		}
	}, [oldData]);

	const allSubCategories = useMemo(() => {
		return categories.filter((cat) => cat.type === 'expense');
	}, [categories]);

	const sortedSubCategories = useMemo(() => {
		if (!subCategory) return allSubCategories;

		const selectedItem = allSubCategories.find((item) => item.value === subCategory);
		if (!selectedItem) return allSubCategories;

		const filtered = allSubCategories.filter((item) => item.value !== subCategory);
		return [selectedItem, ...filtered];
	}, [allSubCategories, subCategory]);

	const visibleSubCategories = isExpanded ? sortedSubCategories : sortedSubCategories.slice(0, 8);

	const handleSelectSubCategory = (value: string) => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setSubCategory(value);
		setIsExpanded(false);
	};

	const toggleExpand = () => {
		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setIsExpanded(!isExpanded);
	};

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
			},
		});
	};

	const handleSaveExpense = async () => {
		if (!user?.uid) return;

		const selectedCategoryObj = allSubCategories.find((cat) => cat.value === subCategory);

		if (!walletId) {
			showWarningToast('Виберіть гаманець списання');
			return;
		}
		if (!subCategory) {
			showWarningToast('Виберіть або створіть підкатегорію');
			return;
		}
		if (amount <= 0) {
			showWarningToast('Сума повинна бути більша за 0');
			return;
		}

		const isReserveGroup = selectedCategoryObj?.group === 'saving' || selectedCategoryObj?.group === 'Резерв';

		const reserveWallet = wallets.find((w) => {
			const labelLower = (w.label || '').toLowerCase();

			const hasExclusiveFlag =
				Boolean((w as any).isExcludedFromTotal) ||
				Boolean((w as any).isExcluded) ||
				Boolean((w as any).isExclusive);

			return (
				w.value === 'pBlwvtk6KTj0rsxM3qtl' ||
				labelLower.includes('заощад') ||
				labelLower.includes('резерв') ||
				labelLower.includes('накопич') ||
				hasExclusiveFlag
			);
		});

		const targetWalletId = isReserveGroup && reserveWallet ? reserveWallet.value : null;

		if (isReserveGroup && !reserveWallet) {
			showWarningToast('Не знайдено цільовий кошелек для резерву');
			return;
		}

		if (isReserveGroup && reserveWallet && reserveWallet.value === walletId) {
			showWarningToast('Неможливо переказувати з резервного гаманця в нього ж');
			return;
		}

		try {
			setLoading(true);

			const payload = {
				uid: user.uid,
				type: 'expense' as const,
				amount,
				walletId,
				targetWalletId,
				categoryGroup: selectedCategoryObj?.group || '',
				category: subCategory,
				date,
				description: description.trim(),
			};

			if (oldData?.id) {
				await transactionService.updateTransaction(oldData.id, payload, oldData);
			} else {
				await transactionService.createTransaction(payload);
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
					Гаманець
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

			{/* Выбор категории*/}
			<View style={{ gap: 10 }}>
				<Typo color={colors.neutral200} size={16}>
					Категорія витрат
				</Typo>

				{allSubCategories.length > 0 ? (
					<View style={{ gap: 10 }}>
						<View style={globalStyles.transCatContainer}>
							{visibleSubCategories.map((item) => {
								const isActive = subCategory === item.value;
								const IconComponent = item.icon;

								return (
									<TouchableOpacity
										key={item.value}
										onPress={() => handleSelectSubCategory(item.value)}
										style={globalStyles.transCatItem}
									>
										<View
											style={[
												globalStyles.transCatIcon,
												isActive && { borderColor: colors.primaryLight },
											]}
										>
											{IconComponent ? (
												<IconComponent
													size={24}
													weight={isActive ? 'fill' : 'bold'}
													color={isActive ? colors.primaryLight : colors.neutral400}
												/>
											) : null}
										</View>

										<Typo
											size={13}
											fontWeight={500}
											color={isActive ? colors.primaryLight : colors.neutral400}
											style={{ textAlign: 'center' }}
										>
											{item.label}
										</Typo>
									</TouchableOpacity>
								);
							})}
						</View>

						{sortedSubCategories.length > 8 && (
							<TouchableOpacity onPress={toggleExpand} style={globalStyles.transCatExpandButton}>
								<Typo color={colors.primaryLight} size={14} fontWeight={600}>
									{isExpanded ? 'Згорнути' : `Ще (${sortedSubCategories.length - 8})`}
								</Typo>
								{isExpanded ? (
									<Icons.CaretUp color={colors.primaryLight} size={18} />
								) : (
									<Icons.CaretDown color={colors.primaryLight} size={18} />
								)}
							</TouchableOpacity>
						)}
					</View>
				) : (
					<Typo size={15} color={colors.neutral400} style={{ textAlign: 'center', marginTop: 15 }}>
						Категорій ще немає. Додати?
					</Typo>
				)}
			</View>

			{/* Кнопка добавления подкатегории */}
			<View>
				<TouchableOpacity style={globalStyles.modalAddCategory} onPress={handleNavigateToAddCategory}>
					<Icons.PlusCircle weight="fill" color={colors.primaryLight} size={33} />
					<Typo color={colors.neutral300} size={16}>
						Додати підкатегорію витрат
					</Typo>
				</TouchableOpacity>
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

ExpenseForm.displayName = 'ExpenseForm';

export default ExpenseForm;
