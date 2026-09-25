import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import ExpenseForm from '@/components/ExpenseForm';
import Header from '@/components/Header';
import IncomeForm from '@/components/IncomeForm';
import Loading from '@/components/Loading';
import ModalWrapper from '@/components/ModalWrapper';
import TransferForm from '@/components/TransferForm';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export type FormRefActions = {
	submit: () => void;
};

type WalletType = {
	id: string;
	name: string;
	amount: number;
	uid: string;
	created?: any;
	isExcludedFromTotal?: boolean;
};

type CategoryItem = {
	label: string;
	value: string;
	group: string;
	type: 'expense' | 'income';
	icon?: React.ComponentType<any>;
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

const TransactionModal = () => {
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
						created: data.created,
					});
				});

				walletsData.sort((a, b) => {
					const timeA = a.created?.seconds || 0;
					const timeB = b.created?.seconds || 0;
					return timeA - timeB;
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
					const iconName = data.icon as keyof typeof Icons;
					const IconComponent =
						iconName && Icons[iconName]
							? (Icons[iconName] as React.ComponentType<any>)
							: Icons.DotsThreeCircle;
					categoriesData.push({
						label: data.name || 'Без назви',
						value: doc.id,
						group: data.group || 'needs',
						type: data.type || 'expense',
						icon: IconComponent,
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

	const listWallets = useMemo(() => {
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
			return <Loading />;
		}
		switch (activeType) {
			case 'expense':
				return (
					<ExpenseForm
						ref={formRef}
						categories={categories}
						wallets={listWallets}
						setLoading={setLoading}
						oldData={parsedOldData}
					/>
				);
			case 'income':
				return (
					<IncomeForm ref={formRef} wallets={listWallets} setLoading={setLoading} oldData={parsedOldData} />
				);
			case 'transfer':
				return (
					<TransferForm ref={formRef} wallets={listWallets} setLoading={setLoading} oldData={parsedOldData} />
				);
			default:
				return null;
		}
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={isEditing ? 'Редагувати транзакцію' : 'Нова транзакція'} leftIcon={<BackButton />} />

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={[globalStyles.modalForm, { paddingBottom: 140 }]}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
					automaticallyAdjustKeyboardInsets={true}
				>
					{!isEditing && (
						<View style={{ gap: 10 }}>
							<Typo color={colors.neutral200} size={16}>
								Тип
							</Typo>
							<View style={{ width: '100%' }}>
								<View style={globalStyles.statSegmentWrap}>
									{transactionTypes.map((item) => {
										const isActive = activeType === item.value;
										const activeTextColor = transactionColors[item.value] || colors.white;
										return (
											<TouchableOpacity
												key={item.value}
												style={globalStyles.statSegmentBtn}
												onPress={() => setActiveType(item.value)}
											>
												{isActive ? (
													<View style={globalStyles.statSegmentActive}>
														<Typo size={16} fontWeight={'500'} color={activeTextColor}>
															{item.label}
														</Typo>
													</View>
												) : (
													<Typo
														size={16}
														color={colors.neutral400}
														style={{ textAlign: 'center' }}
													>
														{item.label}
													</Typo>
												)}
											</TouchableOpacity>
										);
									})}
								</View>
							</View>
						</View>
					)}

					<View>{renderActiveForm()}</View>
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				<Button
					style={{ width: '100%' }}
					onPress={handleMainSubmit}
					disabled={loading || walletsLoading || categoriesLoading}
				>
					{loading ? (
						<Loading />
					) : (
						<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
							{isEditing ? 'Зберегти' : 'Створити'}
						</Typo>
					)}
				</Button>
			</View>
		</ModalWrapper>
	);
};

export default TransactionModal;
