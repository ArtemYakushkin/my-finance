import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import TransactionList from '@/components/TransactionList';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const categoryGroups = [
	{ label: 'База', value: 'needs', color: '#4a90e2', icon: Icons.HouseLine },
	{ label: 'Хочу', value: 'desires', color: '#ef4444', icon: Icons.Star },
	{
		label: 'Резерв',
		value: 'saving',
		color: '#a3e635',
		icon: Icons.PiggyBank,
	},
];

const SearchModal = () => {
	const { user } = useAuth();

	// Состояния для фильтров
	const [search, setSearch] = useState('');
	const [selectedType, setSelectedType] = useState<string | null>(null);
	const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
	const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

	// 1. Загружаем все транзакции пользователя без лимита по месяцу для полноценного поиска
	const { data: allTransactions, loading: transactionsLoading } = useFetchData<any>(
		'transactions',
		user?.uid ? [where('uid', '==', user?.uid), orderBy('date', 'desc')] : [],
	);

	// 2. Загружаем динамические подкатегории для сопоставления ID -> Name и фильтрации
	const { data: userCategories } = useFetchData<any>('categories', user?.uid ? [where('uid', '==', user?.uid)] : []);

	// Список типов транзакций для фильтра
	const transactionTypes = [
		{ label: 'Дохід', value: 'income' },
		{ label: 'Витрата', value: 'expense' },
		{ label: 'Переказ', value: 'transfer' },
	];

	const { data: userWallets, loading: walletsLoading } = useFetchData<any>(
		'wallets',
		user?.uid ? [where('uid', '==', user?.uid)] : [],
	);

	// Отфильтрованный список подкатегорий, принадлежащих выбранной основной группе (categoryGroup)
	const availableSubCategories = useMemo(() => {
		if (!selectedGroup) return [];
		return userCategories.filter((cat) => cat.categoryGroup === selectedGroup);
	}, [selectedGroup, userCategories]);

	// Главная логика фильтрации данных
	const filteredTransactions = useMemo(() => {
		return allTransactions.filter((tx) => {
			// Фильтр по тексту (описание)
			const matchesSearch = search.trim() === '' || tx.description?.toLowerCase().includes(search.toLowerCase());

			// Фильтр по типу транзакции
			const matchesType = !selectedType || tx.type === selectedType;

			// Фильтр по основной группе расходов (актуально только для расходов)
			const matchesGroup = !selectedGroup || tx.categoryGroup === selectedGroup;

			// Фильтр по динамической подкатегории (хранится в tx.category)
			const matchesSubCategory = !selectedSubCategory || tx.category === selectedSubCategory;

			return matchesSearch && matchesType && matchesGroup && matchesSubCategory;
		});
	}, [allTransactions, search, selectedType, selectedGroup, selectedSubCategory]);

	// Сброс зависимых фильтров при смене родительских
	const handleTypeChange = (type: string | null) => {
		setSelectedType(type);
		if (type !== 'expense') {
			setSelectedGroup(null);
			setSelectedSubCategory(null);
		}
	};

	const handleGroupChange = (group: string | null) => {
		setSelectedGroup(group);
		setSelectedSubCategory(null); // сбрасываем подкатегорию при смене группы
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={'Пошук'} leftIcon={<BackButton />} />

				<View style={{ marginTop: 10, marginBottom: 20, gap: 20 }}>
					<View style={{ width: '100%' }}>
						<View style={globalStyles.statSegmentWrap}>
							{[{ label: 'Всі типи', value: null }, ...transactionTypes].map((t) => {
								const isActive = selectedType === t.value;
								return (
									<TouchableOpacity
										key={t.value ?? 'all'}
										style={globalStyles.statSegmentBtn}
										onPress={() => handleTypeChange(t.value)}
									>
										{isActive ? (
											<View style={globalStyles.statSegmentActive}>
												<Typo size={13} fontWeight={'500'} color={colors.neutral50}>
													{t.label}
												</Typo>
											</View>
										) : (
											<Typo size={13} color={colors.neutral400} style={{ textAlign: 'center' }}>
												{t.label}
											</Typo>
										)}
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					{(selectedType === null || selectedType === 'expense') && (
						<View style={{ width: '100%', marginTop: 4 }}>
							<View style={globalStyles.statSegmentWrap}>
								{[{ label: 'Всі групи', value: null }, ...categoryGroups].map((g) => {
									const isActive = selectedGroup === g.value;

									return (
										<TouchableOpacity
											key={g.value ?? 'all'}
											style={globalStyles.statSegmentBtn}
											onPress={() => handleGroupChange(g.value)}
										>
											{isActive ? (
												<View
													style={[
														globalStyles.statSegmentActive,
														g.value && { backgroundColor: g.color }, // Изучаем оригинальный цвет группы при активности
													]}
												>
													<Typo
														size={13}
														fontWeight={'500'}
														color={g.value ? colors.white : colors.neutral50}
													>
														{g.label}
													</Typo>
												</View>
											) : (
												<Typo
													size={13}
													color={colors.neutral400}
													style={{ textAlign: 'center' }}
												>
													{g.label}
												</Typo>
											)}
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
					)}
				</View>

				<ScrollView contentContainerStyle={globalStyles.scrollViewStyle} showsVerticalScrollIndicator={false}>
					<TransactionList
						data={filteredTransactions}
						categories={userCategories}
						wallets={userWallets}
						loading={transactionsLoading}
						filterByMonth={false}
						emptyListMessage="Нічого не знайдено за вашим запитом"
					/>
				</ScrollView>
			</View>
		</ModalWrapper>
	);
};

export default SearchModal;
