import HomeCard from '@/components/HomeCard';
import ScreenWrapper from '@/components/ScreenWrapper';
import TransactionList from '@/components/TransactionList';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { useRouter } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { Pressable, ScrollView, View } from 'react-native';

const Home = () => {
	const { user } = useAuth();
	const router = useRouter();

	// 1. Получаем транзакции пользователя
	const { data: recentTransactions, loading: transactionsLoading } = useFetchData<any>(
		'transactions',
		user?.uid ? [where('uid', '==', user?.uid), orderBy('date', 'desc')] : [],
	);

	// 2. ДИНАМИЧЕСКИ ПОЛУЧАЕМ КАТЕГОРИИ ИЗ FIREBASE
	const { data: userCategories, loading: categoriesLoading } = useFetchData<any>(
		'categories',
		user?.uid ? [where('uid', '==', user?.uid)] : [],
	);

	// 3. ДОБАВЛЕНО: ЗАПРАШИВАЕМ КОШЕЛЬКИ ИЗ FIREBASE
	const { data: userWallets, loading: walletsLoading } = useFetchData<any>(
		'wallets',
		user?.uid ? [where('uid', '==', user?.uid)] : [],
	);

	const isLoading = transactionsLoading || categoriesLoading || walletsLoading;

	return (
		<ScreenWrapper>
			<View style={[globalStyles.container, { marginTop: 8 }]}>
				<View style={globalStyles.header}>
					<View style={{ gap: 4 }}>
						<Typo size={16} color={colors.neutral400}>
							Привіт,
						</Typo>
						<Typo size={20} fontWeight={500}>
							{user?.name}
						</Typo>
					</View>

					<Pressable onPress={() => router.push('/(modals)/searchModal')} style={globalStyles.searchIcon}>
						<Icons.MagnifyingGlass size={27} color={colors.neutral200} weight="bold" />
					</Pressable>
				</View>

				<ScrollView contentContainerStyle={globalStyles.scrollViewStyle} showsVerticalScrollIndicator={false}>
					<View>
						<HomeCard />
					</View>
					<TransactionList
						data={recentTransactions}
						categories={userCategories}
						wallets={userWallets} // <-- КРИТИЧЕСКИ ВАЖНО: Передаем кошельки в список!
						loading={isLoading}
						filterByMonth={true}
						emptyListMessage="В цьому місяці ще немає тразакцій"
					/>
				</ScrollView>
			</View>
		</ScreenWrapper>
	);
};

export default Home;
