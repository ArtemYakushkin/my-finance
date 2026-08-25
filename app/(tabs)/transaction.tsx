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
import { ActivityIndicator, ScrollView, View } from 'react-native';

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
	const params = useLocalSearchParams<{ editData?: string }>();

	const [parsedOldData, setParsedOldData] = useState<any>(null);
	const [activeType, setActiveType] = useState<string>('expense');

	useEffect(() => {
		if (params?.editData) {
			try {
				const data = JSON.parse(params.editData);
				setParsedOldData(data);
				if (data?.type) {
					setActiveType(data.type);
				}
			} catch {
				setParsedOldData(null);
			}
		} else {
			setParsedOldData(null);
			setActiveType('expense');
		}
	}, [params?.editData]);

	const isEditing = !!parsedOldData;

	useEffect(() => {
		const unsubscribe = navigation.addListener('blur', () => {
			setParsedOldData(null);
			setActiveType('expense');
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
			() => {
				setWalletsLoading(false);
			},
		);
		return () => unsubscribe();
	}, [user?.uid]);

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
			() => {
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

					<View
						style={{
							paddingHorizontal: 5,
						}}
					>
						<Button onPress={handleMainSubmit} disabled={loading || walletsLoading || categoriesLoading}>
							{loading ? (
								<ActivityIndicator color={colors.primaryLight} />
							) : (
								<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
									{isEditing ? 'Зберегти' : 'Створити'}
								</Typo>
							)}
						</Button>
					</View>
				</ScrollView>
			</View>
		</ScreenWrapper>
	);
};

export default Transaction;
