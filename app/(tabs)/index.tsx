import Button from '@/components/Button';
import HomeCard from '@/components/HomeCard';
import ScreenWrapper from '@/components/ScreenWrapper';
import TransactionList from '@/components/TransactionList';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { CurrencyItem, fetchPopularRates, getFlagUrl } from '@/services/nbuApi';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TouchableOpacity, View } from 'react-native';

const Home = () => {
	const { user } = useAuth();
	const router = useRouter();

	const [usdData, setUsdData] = useState<CurrencyItem | null>(null);

	useEffect(() => {
		fetchPopularRates().then((rates) => {
			const usd = rates.find((r) => r.cc === 'USD');
			if (usd) setUsdData(usd);
		});
	}, []);

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
				{/* Кнопка вызова модалки создания транзакции */}
				<Button
					style={{
						zIndex: 100,
						height: 50,
						width: 50,
						alignItems: 'center',
						justifyContent: 'center',
						position: 'absolute',
						bottom: 32,
						right: 12,
					}}
					onPress={() => router.push('/(modals)/transactionModal')}
				>
					<Icons.Plus size={32} weight="bold" color={colors.primaryLight} />
				</Button>

				<View style={globalStyles.header}>
					<TouchableOpacity
						onPress={() => router.push('/(modals)/profileModal')}
						style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
					>
						<Image
							style={globalStyles.avatar}
							resizeMode="contain"
							source={user?.image || require('../../assets/images/avatar.png')}
						/>
					</TouchableOpacity>

					{usdData && (
						<TouchableOpacity
							onPress={() => router.push('/(modals)/exchangeRateModal')}
							style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
						>
							<Image
								source={{ uri: getFlagUrl(usdData?.countryCode) }}
								style={{
									width: 40,
									height: 25,
								}}
								contentFit="cover"
							/>
							<View>
								<Typo size={12} color={colors.neutral400}>
									{usdData.txt}
								</Typo>
								<Typo size={14} fontWeight="500" color={colors.white}>
									{usdData.buyRate.toFixed(2)} / {usdData.sellRate.toFixed(2)}
								</Typo>
							</View>
						</TouchableOpacity>
					)}

					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						<Pressable onPress={() => router.push('/(modals)/searchModal')} style={globalStyles.actionIcon}>
							<Icons.Moon size={20} color={colors.neutral200} weight="bold" />
						</Pressable>

						<Pressable onPress={() => router.push('/(modals)/searchModal')} style={globalStyles.actionIcon}>
							<Icons.MagnifyingGlass size={20} color={colors.neutral200} weight="bold" />
						</Pressable>
					</View>
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
