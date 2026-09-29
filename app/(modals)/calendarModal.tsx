import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase';
import { getGlobalStyles } from '@/constants/global';
import { PlannedTransaction } from '@/constants/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { cleanupExpiredTransactions } from '@/services/cleanPastTransactions';
import { getCurrencySymbol } from '@/utils/common';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales['uk'] = {
	monthNames: [
		'Січень',
		'Лютий',
		'Березень',
		'Квітень',
		'Травень',
		'Червень',
		'Липень',
		'Серпень',
		'Вересень',
		'Жовтень',
		'Листопад',
		'Грудень',
	],
	monthNamesShort: ['Січ', 'Лют', 'Бер', 'Квіт', 'Трав', 'Черв', 'Лип', 'Серп', 'Вер', 'Жовт', 'Лист', 'Груд'],
	dayNames: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'],
	dayNamesShort: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
};
LocaleConfig.defaultLocale = 'uk';

interface PlannerProps {
	onEdit?: (item: PlannedTransaction) => void;
	onDelete?: (id: string) => void;
}

const CalendarModal: React.FC<PlannerProps> = ({ onEdit, onDelete }) => {
	const todayStr = new Date().toISOString().split('T')[0].substring(0, 7);
	const [selectedMonth, setSelectedMonth] = useState(todayStr);
	const [items, setItems] = useState<PlannedTransaction[]>([]);
	const [loading, setLoading] = useState(true);
	const { user } = useAuth();
	const currencySymbol = getCurrencySymbol(user?.currency);
	const router = useRouter();

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	useEffect(() => {
		if (user?.uid) {
			cleanupExpiredTransactions(user.uid);
		}
	}, [user]);

	useEffect(() => {
		if (!user?.uid) return;

		setLoading(true);
		const q = query(collection(db, 'planned_transactions'), where('uid', '==', user.uid));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const list: PlannedTransaction[] = [];
				snapshot.forEach((doc) => {
					list.push({ id: doc.id, ...doc.data() } as PlannedTransaction);
				});
				setItems(list);
				setLoading(false);
			},
			(error) => {
				console.error('Помилка завантаження запланованих платежів:', error);
				setLoading(false);
			},
		);

		return () => unsubscribe();
	}, [user?.uid]);

	// Перехід до редагування/видалення транзакції
	const handleTransactionPress = (item: PlannedTransaction) => {
		if (onEdit) {
			onEdit(item);
		}

		router.push({
			pathname: '/(modals)/plannedModal',
			params: {
				id: item.id,
				type: item.type,
				amount: item.amount?.toString(),
				category: item.category,
				dueDate: item.dueDate,
			},
		});
	};

	// Фильтрация транзакций по выбранному месяцу
	const filteredItems = items.filter((item) => item.dueDate?.startsWith(selectedMonth));

	// Подсчет итогов выбранного месяца
	const totalExpenses = filteredItems
		.filter((i) => i.type === 'expense')
		.reduce((sum, i) => sum + Number(i.amount || 0), 0);

	const totalIncomes = filteredItems
		.filter((i) => i.type === 'income')
		.reduce((sum, i) => sum + Number(i.amount || 0), 0);

	// Подсветка дней с запланированными платежами в календаре
	const markedDates: Record<string, any> = {};
	items.forEach((item) => {
		if (item?.dueDate) {
			markedDates[item.dueDate] = {
				marked: true,
				dotColor: item.type === 'expense' ? colors.rose : colors.green,
			};
		}
	});

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={'Планування'} leftIcon={<BackButton />} />

				{loading ? (
					<Loading />
				) : (
					<ScrollView
						contentContainerStyle={globalStyles.statScrollContent}
						showsVerticalScrollIndicator={false}
					>
						<View style={{ gap: 20 }}>
							<Calendar
								firstDay={1}
								hideExtraDays={true}
								theme={{
									calendarBackground: 'transparent',
									monthTextColor: colors.neutral100,
									textMonthFontSize: 16,
									textMonthFontWeight: '700',
									textSectionTitleColor: colors.neutral400,
									textDayHeaderFontSize: 12,
									textDayHeaderFontWeight: '600',
									dayTextColor: colors.neutral100,
									textDayFontSize: 13,
									textDayFontWeight: '700',
									todayTextColor: colors.primaryLight,
									selectedDayBackgroundColor: colors.primaryLight,
									selectedDayTextColor: colors.neutral100,
								}}
								renderArrow={(direction) =>
									direction === 'left' ? (
										<Icons.CaretLeft size={26} color={colors.primaryLight} weight="bold" />
									) : (
										<Icons.CaretRight size={26} color={colors.primaryLight} weight="bold" />
									)
								}
								markedDates={markedDates}
								onMonthChange={(month: any) => {
									const m = month.month < 10 ? `0${month.month}` : month.month;
									setSelectedMonth(`${month.year}-${m}`);
								}}
							/>

							<TouchableOpacity
								style={globalStyles.modalAddCategory}
								onPress={() => router.push('/(modals)/plannedModal')}
							>
								<Icons.PlusCircle weight="fill" color={colors.primaryLight} size={33} />
								<Typo color={colors.neutral200} size={16}>
									Запланувати платіж
								</Typo>
							</TouchableOpacity>

							<View
								style={{
									borderColor: colors.neutral500,
									borderBottomWidth: 1,
									borderTopWidth: 1,
									paddingVertical: 16,
									paddingHorizontal: 12,
									gap: 16,
								}}
							>
								<Typo size={17} fontWeight={'500'} color={colors.neutral300}>
									Підсумок за {selectedMonth}
								</Typo>

								<View style={globalStyles.statsCard}>
									<View style={{ gap: 5 }}>
										<View style={globalStyles.incomeExpenseCard}>
											<View style={globalStyles.statsIconCard}>
												<Icons.ArrowUp size={15} color={colors.neutral900} weight="bold" />
											</View>
											<Typo size={16} fontWeight={'500'} color={colors.neutral300}>
												Дохід
											</Typo>
										</View>
										<View>
											<Typo size={17} fontWeight={'600'} color={colors.green}>
												{currencySymbol} {totalIncomes.toLocaleString('uk-UA')}
											</Typo>
										</View>
									</View>

									<View style={{ gap: 5 }}>
										<View style={globalStyles.incomeExpenseCard}>
											<View style={globalStyles.statsIconCard}>
												<Icons.ArrowDown size={15} color={colors.neutral900} weight="bold" />
											</View>
											<Typo size={16} fontWeight={'500'} color={colors.neutral300}>
												Витрати
											</Typo>
										</View>
										<View>
											<Typo size={17} fontWeight={'600'} color={colors.rose}>
												{currencySymbol} {totalExpenses.toLocaleString('uk-UA')}
											</Typo>
										</View>
									</View>
								</View>
							</View>

							{filteredItems.length === 0 ? (
								<View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 30 }}>
									<Icons.CalendarX size={48} color={colors.neutral400} weight="light" />
									<Typo size={15} color={colors.neutral400} style={{ marginTop: 8 }}>
										На цей місяць нічого не заплановано
									</Typo>
								</View>
							) : (
								<View style={{ gap: 12, paddingBottom: 60 }}>
									{filteredItems.map((item) => (
										<TouchableOpacity
											key={item.id}
											activeOpacity={0.7}
											onPress={() => handleTransactionPress(item)}
										>
											<View style={globalStyles.transRow}>
												<View style={globalStyles.transCategoryDes}>
													<Typo size={16} fontWeight={'600'} color={colors.neutral100}>
														{item.title}
													</Typo>
													<Typo size={12} color={colors.neutral400}>
														{item.dueDate}
													</Typo>
												</View>
												<View style={globalStyles.transAmountDate}>
													<Typo
														fontWeight={'700'}
														color={item.type === 'income' ? colors.green : colors.rose}
													>
														{item.type === 'income' ? '+' : '-'} {item.amount}{' '}
														{currencySymbol}
													</Typo>
													<Typo size={13} color={colors.neutral400}>
														{item.isRecurring
															? item.frequency === 'monthly'
																? 'Щомісячний'
																: 'Щорічний'
															: ''}
													</Typo>
												</View>
											</View>
										</TouchableOpacity>
									))}
								</View>
							)}
						</View>
					</ScrollView>
				)}
			</View>
		</ModalWrapper>
	);
};

export default CalendarModal;
