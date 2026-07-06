import Button from '@/components/Button';
import ExpenseForm from '@/components/ExpenseForm';
import Header from '@/components/Header';
import IncomeForm from '@/components/IncomeForm';
import ScreenWrapper from '@/components/ScreenWrapper';
import TransferForm from '@/components/TransferForm';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

export type FormRefActions = {
	submit: () => void;
};

type WalletType = {
	id: string;
	name: string;
	amount: number;
	uid: string;
};

// Добавляем тип для категорий, которые будем получать из Firestore
type CategoryItem = {
	label: string;
	value: string;
	group: string;
	type: 'expense' | 'income';
};

const transactionTypes = [
	{ label: 'Витрати', value: 'expense' },
	{ label: 'Дохід', value: 'income' },
	{ label: 'Переказ', value: 'transfer' },
];

const transactionColors: Record<string, string> = {
	income: colors.primary,
	expense: colors.rose,
	transfer: colors.primaryLight,
};

const Transaction = () => {
	const { user } = useAuth();
	const [activeType, setActiveType] = useState<string>('expense');
	const [loading, setLoading] = useState<boolean>(false);

	// Стейты для кошельков
	const [wallets, setWallets] = useState<WalletType[]>([]);
	const [walletsLoading, setWalletsLoading] = useState<boolean>(true);

	// СНОВЫЕ СТЕЙТЫ ДЛЯ КАТЕГОРИЙ
	const [categories, setCategories] = useState<CategoryItem[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

	const formRef = useRef<FormRefActions>(null);

	// 1. СЛУШАЕМ КОЛЛЕКЦИЮ WALLETS В РЕАЛЬНОМ ВРЕМЕНИ
	useEffect(() => {
		if (!user?.uid) return;

		const q = query(collection(db, 'wallets'), where('uid', '==', user.uid));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const walletsData: WalletType[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					walletsData.push({
						id: doc.id,
						name: data.name || 'Без назви',
						amount: data.amount || 0,
						uid: data.uid,
					});
				});
				setWallets(walletsData);
				setWalletsLoading(false);
			},
			(error) => {
				console.error('Помилка при отриманні гаманців: ', error);
				setWalletsLoading(false);
			},
		);

		return () => unsubscribe();
	}, [user?.uid]);

	// 2. СЛУШАЕМ КОЛЛЕКЦИЮ CATEGORIES В РЕАЛЬНОМ ВРЕМЕНИ
	useEffect(() => {
		if (!user?.uid) return;

		// Тянем категории конкретного пользователя
		const q = query(collection(db, 'categories'), where('uid', '==', user.uid));

		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const categoriesData: CategoryItem[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					categoriesData.push({
						label: data.name || 'Без назви', // Имя категории, которое видит юзер
						value: doc.id, // ID документа используем как value
						group: data.group || 'needs', // needs, desires, saving
						type: data.type || 'expense', // expense, income
					});
				});
				setCategories(categoriesData);
				setCategoriesLoading(false);
			},
			(error) => {
				console.error('Помилка при отриманні категорій: ', error);
				setCategoriesLoading(false);
			},
		);

		return () => unsubscribe();
	}, [user?.uid]);

	const dropdownWallets = useMemo(() => {
		return wallets.map((w) => ({
			label: `${w.name} (${w.amount} ₴)`,
			value: w.id,
		}));
	}, [wallets]);

	const handleMainSubmit = () => {
		if (formRef.current) {
			formRef.current.submit();
		}
	};

	const renderActiveForm = () => {
		// Ждем загрузки и кошельков, и категорий
		if (walletsLoading || categoriesLoading) {
			return <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />;
		}

		switch (activeType) {
			case 'expense':
				return (
					<ExpenseForm
						ref={formRef}
						categories={categories} // Передаем живой массив категорий
						wallets={dropdownWallets}
						setLoading={setLoading}
					/>
				);
			case 'income':
				return <IncomeForm ref={formRef} wallets={dropdownWallets} setLoading={setLoading} />;
			case 'transfer':
				return <TransferForm ref={formRef} wallets={dropdownWallets} setLoading={setLoading} />;
			default:
				return null;
		}
	};

	return (
		<ScreenWrapper>
			<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
				<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
					<Header title={'Нова транзакція'} />

					<ScrollView
						contentContainerStyle={[globalStyles.modalForm, { flexGrow: 1 }]}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
					>
						{/* Селектор типа */}
						<View style={{ gap: 10, marginBottom: 15 }}>
							<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
								Тип
							</Typo>
							<View style={globalStyles.modalBtnWrap}>
								{transactionTypes.map((item) => {
									const isActive = activeType === item.value;
									const activeTextColor = transactionColors[item.value] || colors.white;

									return (
										<Button
											key={item.value}
											onPress={() => setActiveType(item.value)}
											style={{ flex: 1 }}
										>
											<Typo
												size={16}
												fontWeight={isActive ? '700' : '500'}
												color={isActive ? activeTextColor : colors.neutral400}
											>
												{item.label}
											</Typo>
										</Button>
									);
								})}
							</View>
						</View>

						{/* Динамическая форма */}
						<View>{renderActiveForm()}</View>

						{/* Кнопка "Створити" */}
						<Button
							onPress={handleMainSubmit}
							style={{
								flex: 1,
							}}
							disabled={loading || walletsLoading || categoriesLoading}
						>
							{loading ? (
								<ActivityIndicator color={colors.primaryLight} />
							) : (
								<Typo fontWeight={'700'} color={colors.primaryLight} size={18}>
									Створити
								</Typo>
							)}
						</Button>
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</ScreenWrapper>
	);
};

export default Transaction;
