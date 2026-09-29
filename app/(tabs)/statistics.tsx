import Header from '@/components/Header';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { getGlobalStyles } from '@/constants/global';
import { categoryGroups } from '@/constants/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { fetchCategories, fetchMonthStats, fetchYearStats } from '@/services/transactionService';
import { getCurrencySymbol } from '@/utils/common';
import { showErrorToast } from '@/utils/showToast';
import { useFocusEffect } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { CaretLeft, CaretRight, Icon } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

type TransactionType = {
	id?: string;
	type: string;
	amount: number;
	categoryGroup?: string;
	category?: string;
	date: Date | Timestamp | string;
	description?: string;
	image?: any;
	uid?: string;
	walletId: string;
};

type CategoryType = {
	name: string;
	group: 'needs' | 'desires' | 'saving';
	label: string;
	value: string;
	icon: Icon;
	bgColor: string;
};

const Statistics = () => {
	const { user } = useAuth();
	const [activeIndex, setActiveIndex] = useState(0);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [userCategories, setUserCategories] = useState<CategoryType[]>([]);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<{ stats: any[]; transactions: TransactionType[] }>({
		stats: [],
		transactions: [],
	});

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	useEffect(() => {
		const loadUserCategories = async () => {
			if (!user?.uid) return;
			const res = await fetchCategories(user.uid);
			if (res.success) {
				setUserCategories(res.data as CategoryType[]);
			}
		};

		loadUserCategories();
	}, [user?.uid]);

	const loadData = async () => {
		if (!user?.uid) return;
		setLoading(true);
		try {
			let res;
			if (activeIndex === 0) {
				res = await fetchMonthStats(user.uid, selectedDate);
			} else {
				res = await fetchYearStats(user.uid, selectedDate);
			}

			if (res?.success) {
				setData({
					stats: res.data.stats || [],
					transactions: res.data.transactions || [],
				});
			} else {
				showErrorToast(res?.msg || 'Не вдалося завантажити статистику');
			}
		} catch (error) {
			showErrorToast("Не вдалося завантажити статистику. Перевірте з'єднання");
		} finally {
			setLoading(false);
		}
	};

	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [activeIndex, selectedDate, user?.uid]),
	);

	const handleMoveDate = (step: number) => {
		const newDate = new Date(selectedDate);
		if (activeIndex === 0) {
			newDate.setMonth(selectedDate.getMonth() + step);
		} else {
			newDate.setFullYear(selectedDate.getFullYear() + step);
		}
		setSelectedDate(newDate);
	};

	const getPeriodText = () => {
		if (activeIndex === 0) {
			return selectedDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
		}
		return selectedDate.getFullYear().toString();
	};

	const getPieChartData = () => {
		let totals = { needs: 0, desires: 0, saving: 0 };
		const transactions = data.transactions || [];

		transactions.forEach((item: TransactionType) => {
			if (item.type === 'expense') {
				const amount = Number(item.amount) || 0;
				const foundCat = userCategories.find((c) => c.name === item.category);
				const group = item.categoryGroup || foundCat?.group;

				if (group === 'needs') totals.needs += amount;
				else if (group === 'desires') totals.desires += amount;
				else if (group === 'saving') totals.saving += amount;
			}
		});

		const totalExpense = totals.needs + totals.desires + totals.saving;
		if (totalExpense === 0) return [];

		return [
			{ value: totals.needs, color: '#4a90e2', text: 'База', focused: true },
			{ value: totals.desires, color: '#ef4444', text: 'Хочу' },
			{ value: totals.saving, color: '#a3e635', text: 'Резерв' },
		].filter((i) => i.value > 0);
	};

	const getSubCategoryData = () => {
		const transactions = data.transactions || [];

		const grouped = transactions.reduce(
			(acc, item) => {
				if (item.type === 'expense') {
					const catId = item.category || 'other';
					acc[catId] = (acc[catId] || 0) + (Number(item.amount) || 0);
				}
				return acc;
			},
			{} as Record<string, number>,
		);

		return Object.keys(grouped)
			.map((catId) => {
				const userCat = userCategories.find((c: any) => c.id === catId || c.value === catId);
				const groupKey = userCat?.group || transactions.find((t) => t.category === catId)?.categoryGroup;
				const mainGroup = categoryGroups.find((g) => g.value === groupKey);

				return {
					name: userCat?.label || userCat?.name || 'Інше',
					amount: grouped[catId],
					icon: userCat?.icon || mainGroup?.icon,
					color: mainGroup?.color || colors.neutral500,
				};
			})
			.sort((a, b) => b.amount - a.amount);
	};

	const getIncomeExpensePieData = () => {
		let income = 0;
		let expense = 0;
		const transactions = data.transactions || [];

		transactions.forEach((item: TransactionType) => {
			const amount = Number(item.amount) || 0;
			if (item.type === 'income') {
				income += amount;
			} else if (item.type === 'expense') {
				expense += amount;
			}
		});

		if (income === 0 && expense === 0) return [];

		return [
			{ value: income, color: '#a3e635', text: 'Дохід' },
			{ value: expense, color: '#ef4444', text: 'Витрати' },
		];
	};

	const pieData = getPieChartData();
	const currencySymbol = getCurrencySymbol(user?.currency);
	const subCategories = getSubCategoryData();
	const incomeExpensePieData = getIncomeExpensePieData();

	return (
		<ScreenWrapper>
			<View style={globalStyles.container}>
				<Header title="Статистика" />

				<ScrollView
					contentContainerStyle={[globalStyles.statScrollContent, { gap: 30 }]}
					showsVerticalScrollIndicator={false}
				>
					<View>
						<View style={globalStyles.statSegmentWrap}>
							{['Місяць', 'Рік'].map((label, index) => (
								<TouchableOpacity
									key={label}
									style={globalStyles.statSegmentBtn}
									onPress={() => setActiveIndex(index)}
								>
									{activeIndex === index ? (
										<View style={globalStyles.statSegmentActive}>
											<Typo size={13} fontWeight={'500'} color={colors.neutral100}>
												{label}
											</Typo>
										</View>
									) : (
										<Typo size={13} color={colors.neutral400} style={{ textAlign: 'center' }}>
											{label}
										</Typo>
									)}
								</TouchableOpacity>
							))}
						</View>
					</View>

					<View style={globalStyles.statDateWrap}>
						<TouchableOpacity onPress={() => handleMoveDate(-1)}>
							<CaretLeft size={22} color={colors.neutral200} weight="bold" />
						</TouchableOpacity>
						<Typo
							size={18}
							fontWeight={'600'}
							color={colors.neutral100}
							style={{ textTransform: 'capitalize' }}
						>
							{getPeriodText()}
						</Typo>
						<TouchableOpacity onPress={() => handleMoveDate(1)}>
							<CaretRight size={22} color={colors.neutral200} weight="bold" />
						</TouchableOpacity>
					</View>

					<View style={globalStyles.statPieInner}>
						<Typo size={18} fontWeight={'600'} color={colors.neutral100} style={{ marginBottom: 20 }}>
							Співвідношення бюджету
						</Typo>
						{incomeExpensePieData.length > 0 ? (
							<View style={globalStyles.statPieContainer}>
								<PieChart
									data={incomeExpensePieData}
									donut
									showGradient
									radius={85}
									innerRadius={60}
									innerCircleColor={colors.gradientMid}
									centerLabelComponent={() => {
										const inc = incomeExpensePieData.find((i) => i.text === 'Дохід')?.value || 0;
										const exp = incomeExpensePieData.find((i) => i.text === 'Витрати')?.value || 0;
										const balance = inc - exp;
										return (
											<View style={{ alignItems: 'center' }}>
												<Typo size={12} color={colors.neutral400}>
													Баланс
												</Typo>
												<Typo
													size={14}
													fontWeight={'700'}
													color={balance >= 0 ? '#a3e635' : '#ef4444'}
												>
													{balance >= 0 ? '+' : ''}
													{balance.toLocaleString()}
												</Typo>
											</View>
										);
									}}
								/>

								<View style={globalStyles.statPieLegend}>
									{incomeExpensePieData.map((item, idx) => (
										<View key={idx} style={globalStyles.statPieLegendItem}>
											<View
												style={[globalStyles.statPieLegendDot, { backgroundColor: item.color }]}
											/>
											<Typo size={13} color={colors.neutral300}>
												{item.text}
											</Typo>
											<Typo size={13} fontWeight={'700'} color={colors.neutral300}>
												{currencySymbol}
												{item.value}
											</Typo>
										</View>
									))}
								</View>
							</View>
						) : (
							<View style={globalStyles.noDataContainer}>
								<Typo color={colors.neutral400}>Немає даних</Typo>
							</View>
						)}
					</View>

					<View style={globalStyles.statPieInner}>
						<Typo size={18} fontWeight={'600'} color={colors.neutral100} style={{ marginBottom: 20 }}>
							Розподіл витрат
						</Typo>
						{pieData.length > 0 ? (
							<View style={globalStyles.statPieContainer}>
								<PieChart
									data={pieData}
									donut
									showGradient
									radius={85}
									innerRadius={60}
									innerCircleColor={colors.gradientMid}
									centerLabelComponent={() => (
										<View style={{ alignItems: 'center' }}>
											<Typo size={12} color={colors.neutral400}>
												Всього
											</Typo>
											<Typo size={16} fontWeight={'700'} color={colors.neutral100}>
												{currencySymbol}{' '}
												{pieData.reduce((acc, cur) => acc + cur.value, 0).toLocaleString()}
											</Typo>
										</View>
									)}
								/>
								<View style={globalStyles.statPieLegend}>
									{pieData.map((item, idx) => (
										<View key={idx} style={globalStyles.statPieLegendItem}>
											<View
												style={[globalStyles.statPieLegendDot, { backgroundColor: item.color }]}
											/>
											<Typo size={13} color={colors.neutral300}>
												{item.text}
											</Typo>
											<Typo size={13} fontWeight={'600'} color={colors.neutral100}>
												{(
													(item.value / pieData.reduce((a, b) => a + b.value, 0)) *
													100
												).toFixed(1)}
												%
											</Typo>
										</View>
									))}
								</View>
							</View>
						) : (
							<View style={globalStyles.noDataContainer}>
								<Typo color={colors.neutral400}>Немає даних</Typo>
							</View>
						)}
					</View>

					<View style={{ gap: 12 }}>
						<Typo size={18} fontWeight={'600'} color={colors.neutral100} style={{ textAlign: 'center' }}>
							Деталі по категоріях
						</Typo>
						{subCategories.map((item, index) => {
							const iconKey = item.icon as unknown as string;
							const IconComponent = (Icons as Record<string, any>)[iconKey] || Icons.Question;
							return (
								<View style={globalStyles.statCategoryCard} key={index}>
									<View style={globalStyles.statCategoryInfo}>
										<View style={[globalStyles.statIconWrapper, { backgroundColor: item.color }]}>
											<IconComponent
												size={20}
												weight="fill"
												color={isDark ? colors.neutral100 : colors.neutral900}
											/>
										</View>
										<Typo size={16} fontWeight={'500'} color={colors.neutral100}>
											{item.name}
										</Typo>
									</View>
									<Typo size={16} fontWeight={'700'} color={colors.neutral100}>
										{currencySymbol}
										{item.amount.toLocaleString()}
									</Typo>
								</View>
							);
						})}
					</View>
				</ScrollView>
			</View>
		</ScreenWrapper>
	);
};

export default Statistics;
