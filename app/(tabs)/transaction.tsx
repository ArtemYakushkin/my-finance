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
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, View } from 'react-native';

export type FormRefActions = {
	submit: () => void;
};

type WalletType = {
	id: string;
	name: string;
	amount: number;
	uid: string;
};

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
	const navigation = useNavigation();

	// Получаем параметры роута
	const params = useLocalSearchParams<{ editData?: string }>();

	// Храним спарсенные данные в локальном стейте, чтобы иметь возможность его обнулить
	const [parsedOldData, setParsedOldData] = useState<any>(null);
	const [activeType, setActiveType] = useState<string>('expense');

	// Эффект для безопасного парсинга входящих параметров редактирования
	useEffect(() => {
		if (params?.editData) {
			try {
				const data = JSON.parse(params.editData);
				setParsedOldData(data);
				if (data?.type) {
					setActiveType(data.type);
				}
			} catch (e) {
				console.error('Помилка парсингу editData:', e);
				setParsedOldData(null);
			}
		} else {
			setParsedOldData(null);
			setActiveType('expense');
		}
	}, [params?.editData]);

	const isEditing = !!parsedOldData;

	// СБРОС ПАРАМЕТРОВ ПРИ УХОДЕ С ЭКРАНА (Очищает URL от editData)
	useEffect(() => {
		const unsubscribe = navigation.addListener('blur', () => {
			setParsedOldData(null);
			setActiveType('expense');
			// Принудительно чистим параметры в самом роутере Expo, чтобы при следующем входе стек был чист
			navigation.setParams({ editData: undefined } as any);
		});
		return unsubscribe;
	}, [navigation]);

	const [loading, setLoading] = useState<boolean>(false);
	const [wallets, setWallets] = useState<WalletType[]>([]);
	const [walletsLoading, setWalletsLoading] = useState<boolean>(true);
	const [categories, setCategories] = useState<CategoryItem[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

	const formRef = useRef<FormRefActions>(null);

	// Подписка на кошельки
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
				console.error(error);
				setWalletsLoading(false);
			},
		);
		return () => unsubscribe();
	}, [user?.uid]);

	// Подписка на категории
	useEffect(() => {
		if (!user?.uid) return;
		const q = query(collection(db, 'categories'), where('uid', '==', user.uid));
		const unsubscribe = onSnapshot(
			q,
			(snapshot) => {
				const categoriesData: CategoryItem[] = [];
				snapshot.forEach((doc) => {
					const data = doc.data();
					categoriesData.push({
						label: data.name || 'Без назви',
						value: doc.id,
						group: data.group || 'needs',
						type: data.type || 'expense',
					});
				});
				setCategories(categoriesData);
				setCategoriesLoading(false);
			},
			(error) => {
				console.error(error);
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
		if (walletsLoading || categoriesLoading) {
			return <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />;
		}
		switch (activeType) {
			case 'expense':
				return (
					<ExpenseForm
						ref={formRef}
						categories={categories}
						wallets={dropdownWallets}
						setLoading={setLoading}
						oldData={parsedOldData}
					/>
				);
			case 'income':
				return (
					<IncomeForm
						ref={formRef}
						wallets={dropdownWallets}
						setLoading={setLoading}
						oldData={parsedOldData}
					/>
				);
			case 'transfer':
				return (
					<TransferForm
						ref={formRef}
						wallets={dropdownWallets}
						setLoading={setLoading}
						oldData={parsedOldData}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<ScreenWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={isEditing ? 'Редагувати транзакцію' : 'Нова транзакція'} />

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={[globalStyles.modalForm, { paddingBottom: 100 }]}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					automaticallyAdjustKeyboardInsets={true}
				>
					{!isEditing && (
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
					)}

					<View style={{ marginBottom: 10 }}>{renderActiveForm()}</View>
				</ScrollView>

				<View
					style={{
						paddingHorizontal: 16,
						paddingBottom: Platform.OS === 'ios' ? 24 : 16,
						paddingTop: 10,
						backgroundColor: 'transparent',
					}}
				>
					<Button
						onPress={handleMainSubmit}
						style={{ width: '100%' }}
						disabled={loading || walletsLoading || categoriesLoading}
					>
						{loading ? (
							<ActivityIndicator color={colors.primaryLight} />
						) : (
							<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
								{isEditing ? 'Зберегти' : 'Створити'}
							</Typo>
						)}
					</Button>
				</View>
			</View>
		</ScreenWrapper>
	);
};

export default Transaction;
