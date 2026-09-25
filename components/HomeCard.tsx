import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { getCurrencySymbol } from '@/utils/common';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useMemo } from 'react';
import { ImageBackground, View } from 'react-native';
import Typo from './Typo';

type WalletType = {
	id?: string;
	name: string;
	amount?: number;
	totalIncome?: number;
	totalExpenses?: number;
	image: any;
	uid?: string;
	created?: Date;
};

const HomeCard = () => {
	const { user } = useAuth();
	const currencySymbol = getCurrencySymbol(user?.currency);

	const constraints = useMemo(() => {
		if (!user?.uid) return [];
		return [where('uid', '==', user.uid), orderBy('created', 'desc')];
	}, [user?.uid]);

	const { data: wallets, error, loading: walletLoading } = useFetchData<WalletType>('wallets', constraints);

	const totals = useMemo(() => {
		if (!wallets || wallets.length === 0) {
			return { balance: 0, income: 0, expenses: 0 };
		}

		return wallets.reduce(
			(acc, item: WalletType) => {
				acc.balance += Number(item.amount || 0);
				acc.income += Number(item.totalIncome || 0);
				acc.expenses += Number(item.totalExpenses || 0);
				return acc;
			},
			{ balance: 0, income: 0, expenses: 0 },
		);
	}, [wallets]);

	const isInitialLoading = walletLoading && (!wallets || wallets.length === 0);

	return (
		<ImageBackground
			source={require('../assets/images/Card.png')}
			resizeMode="stretch"
			style={globalStyles.bgImageCard}
		>
			<View style={globalStyles.containerCard}>
				<View>
					<View style={globalStyles.totalBalanceCard}>
						<Typo size={17} fontWeight={500} color={colors.neutral300}>
							Загальний баланс
						</Typo>
					</View>
					<View style={{ minHeight: 40, justifyContent: 'center' }}>
						<Typo size={30} fontWeight={'bold'} color={colors.white}>
							{currencySymbol} {isInitialLoading ? '----' : totals.balance.toFixed(2)}
						</Typo>
					</View>
				</View>

				<View style={globalStyles.statsCard}>
					{/* Доход */}
					<View style={{ gap: 5 }}>
						<View style={globalStyles.incomeExpenseCard}>
							<View style={globalStyles.statsIconCard}>
								<Icons.ArrowUp size={15} color={colors.black} weight="bold" />
							</View>
							<Typo size={16} fontWeight={500} color={colors.neutral300}>
								Дохід
							</Typo>
						</View>
						<View>
							<Typo size={17} fontWeight={600} color={colors.green}>
								{currencySymbol} {isInitialLoading ? '----' : totals.income.toFixed(2)}
							</Typo>
						</View>
					</View>

					{/* Расход */}
					<View style={{ gap: 5 }}>
						<View style={globalStyles.incomeExpenseCard}>
							<View style={globalStyles.statsIconCard}>
								<Icons.ArrowDown size={15} color={colors.black} weight="bold" />
							</View>
							<Typo size={16} fontWeight={500} color={colors.neutral300}>
								Витрати
							</Typo>
						</View>
						<View>
							<Typo size={17} fontWeight={600} color={colors.rose}>
								{currencySymbol} {isInitialLoading ? '----' : totals.expenses.toFixed(2)}
							</Typo>
						</View>
					</View>
				</View>
			</View>
		</ImageBackground>
	);
};

export default HomeCard;
