import Header from '@/components/Header';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT, MAIN_GRADIENT } from '@/constants/gradient';
import { SHADOW_BLOCK } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { categoryGroups } from '@/constants/types';
import { useAuth } from '@/context/useAuth';
import { fetchCategories, fetchMonthStats, fetchYearStats } from '@/services/transactionService';
import { getCurrencySymbol } from '@/utils/common';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { CaretLeft, CaretRight, Icon } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Shadow } from 'react-native-shadow-2';

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
	const [activeIndex, setActiveIndex] = useState(1);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [userCategories, setUserCategories] = useState<CategoryType[]>([]);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<{ stats: any[]; transactions: TransactionType[] }>({
		stats: [],
		transactions: [],
	});

	// 1. Загружаем пользовательские категории один раз при монтировании юзера
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

	// 2. Метод загрузки основных статистических данных
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
			}
		} catch (error) {
			console.error('Error loading stats:', error);
		} finally {
			setLoading(false);
		}
	};

	// 3. Используем только useFocusEffect для контроля обновлений экрана
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

		// 1. Группируем суммы по ID подкатегорий
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

		// 2. Маппим сгруппированные ID в человекочитаемые данные
		return Object.keys(grouped)
			.map((catId) => {
				// Ищем подкатегорию в userCategories.
				// Проверьте, какое поле у вас отвечает за ID документа (id, uid или value)
				const userCat = userCategories.find((c: any) => c.id === catId || c.value === catId);

				// Определяем, к какой глобальной группе (База, Хочу, Резерв) она относится
				const groupKey = userCat?.group || transactions.find((t) => t.category === catId)?.categoryGroup;
				const mainGroup = categoryGroups.find((g) => g.value === groupKey);

				return {
					// Если подкатегория найдена в базе, берем её label/name, иначе пишем "Інше"
					name: userCat?.label || userCat?.name || 'Інше',
					amount: grouped[catId],
					// Берем родную иконку подкатегории, если её нет — иконку родительской группы
					icon: userCat?.icon || mainGroup?.icon,
					// Берем цвет родительской группы для сохранения логики дизайна
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
					contentContainerStyle={[globalStyles.statScrollContent, { gap: 30, paddingHorizontal: 10 }]}
					showsVerticalScrollIndicator={false}
				>
					<View>
						<Shadow {...SHADOW_BLOCK.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
							<Shadow {...SHADOW_BLOCK.dark} style={{ alignSelf: 'stretch' }}>
								<View style={globalStyles.statSegmentWrap}>
									{['Місяць', 'Рік'].map((label, index) => (
										<TouchableOpacity
											key={label}
											style={globalStyles.statSegmentBtn}
											onPress={() => setActiveIndex(index)}
										>
											{activeIndex === index ? (
												<View style={globalStyles.statSegmentActive}>
													<Text
														style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}
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
									))}
								</View>
							</Shadow>
						</Shadow>
					</View>

					<View style={globalStyles.statDateWrap}>
						<TouchableOpacity onPress={() => handleMoveDate(-1)}>
							<CaretLeft size={22} color={colors.neutral200} weight="bold" />
						</TouchableOpacity>
						<Typo size={18} fontWeight={'600'} style={{ textTransform: 'capitalize' }}>
							{getPeriodText()}
						</Typo>
						<TouchableOpacity onPress={() => handleMoveDate(1)}>
							<CaretRight size={22} color={colors.neutral200} weight="bold" />
						</TouchableOpacity>
					</View>

					<View>
						<Shadow {...SHADOW_BLOCK.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
							<Shadow {...SHADOW_BLOCK.dark} style={{ alignSelf: 'stretch' }}>
								<LinearGradient {...(MAIN_GRADIENT as any)} style={globalStyles.statPieInner}>
									<Typo size={18} fontWeight={'600'} style={{ marginBottom: 20 }}>
										Співвідношення бюджету
									</Typo>
									{incomeExpensePieData.length > 0 ? (
										<View style={globalStyles.statPieContainer}>
											<PieChart
												data={incomeExpensePieData}
												donut
												showGradient
												radius={100}
												innerRadius={70}
												innerCircleColor={colors.gradientMid}
												centerLabelComponent={() => {
													const inc =
														incomeExpensePieData.find((i) => i.text === 'Дохід')?.value ||
														0;
													const exp =
														incomeExpensePieData.find((i) => i.text === 'Витрати')?.value ||
														0;
													const balance = inc - exp;
													return (
														<View style={{ alignItems: 'center' }}>
															<Typo size={10} color={colors.neutral400}>
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

											{/* Кастомный вывод четких сумм без градации */}
											<View style={globalStyles.statPieLegend}>
												{incomeExpensePieData.map((item, idx) => (
													<View key={idx} style={globalStyles.statPieLegendItem}>
														<View
															style={[
																globalStyles.statPieLegendDot,
																{ backgroundColor: item.color },
															]}
														/>
														<View style={{ flex: 1, marginRight: 10 }}>
															<Typo size={13} color={colors.neutral300}>
																{item.text}
															</Typo>
														</View>
														<Typo size={13} fontWeight={'700'}>
															{currencySymbol}
															{item.value.toLocaleString()}
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
								</LinearGradient>
							</Shadow>
						</Shadow>
					</View>

					<View>
						<Shadow {...SHADOW_BLOCK.light} style={{ borderRadius: 17, alignSelf: 'stretch' }}>
							<Shadow {...SHADOW_BLOCK.dark} style={{ alignSelf: 'stretch' }}>
								<LinearGradient {...(MAIN_GRADIENT as any)} style={globalStyles.statPieInner}>
									<Typo size={18} fontWeight={'600'} style={{ marginBottom: 20 }}>
										Розподіл витрат
									</Typo>
									{pieData.length > 0 ? (
										<View style={globalStyles.statPieContainer}>
											<PieChart
												data={pieData}
												donut
												showGradient
												radius={100}
												innerRadius={70}
												innerCircleColor={colors.gradientMid}
												centerLabelComponent={() => (
													<View style={{ alignItems: 'center' }}>
														<Typo size={12} color={colors.neutral400}>
															Всього
														</Typo>
														<Typo size={16} fontWeight={'700'}>
															{currencySymbol}{' '}
															{pieData
																.reduce((acc, cur) => acc + cur.value, 0)
																.toLocaleString()}
														</Typo>
													</View>
												)}
											/>
											<View style={globalStyles.statPieLegend}>
												{pieData.map((item, idx) => (
													<View key={idx} style={globalStyles.statPieLegendItem}>
														<View
															style={[
																globalStyles.statPieLegendDot,
																{ backgroundColor: item.color },
															]}
														/>
														<Typo size={13} color={colors.neutral300}>
															{item.text}
														</Typo>
														<Typo size={13} fontWeight={'600'}>
															{(
																(item.value /
																	pieData.reduce((a, b) => a + b.value, 0)) *
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
								</LinearGradient>
							</Shadow>
						</Shadow>
					</View>

					<View style={{ gap: 20 }}>
						<Typo size={18} fontWeight={'600'} style={{ textAlign: 'center' }}>
							Деталі по категоріях
						</Typo>
						{subCategories.map((item, index) => {
							const IconComponent = item.icon;
							return (
								<Shadow
									key={index}
									{...SHADOW_BLOCK.light}
									style={{ borderRadius: 17, alignSelf: 'stretch' }}
								>
									<Shadow {...SHADOW_BLOCK.dark} style={{ alignSelf: 'stretch' }}>
										<LinearGradient
											{...(BUTTON_GRADIENT as any)}
											style={globalStyles.statCategoryCard}
										>
											<View style={globalStyles.statCategoryInfo}>
												<View
													style={[
														globalStyles.statIconWrapper,
														{ backgroundColor: item.color },
													]}
												>
													{IconComponent && (
														<IconComponent size={20} weight="fill" color={colors.white} />
													)}
												</View>
												<Typo size={16} fontWeight={'500'}>
													{item.name}
												</Typo>
											</View>
											<Typo size={16} fontWeight={'700'}>
												{currencySymbol}
												{item.amount.toLocaleString()}
											</Typo>
										</LinearGradient>
									</Shadow>
								</Shadow>
							);
						})}
					</View>
				</ScrollView>
			</View>
		</ScreenWrapper>
	);
};

export default Statistics;
