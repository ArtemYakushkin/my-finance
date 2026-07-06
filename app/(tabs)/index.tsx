import HomeCard from '@/components/HomeCard';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const Home = () => {
	const { user } = useAuth();
	const router = useRouter();

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

					<TouchableOpacity
						onPress={() => router.push('/(modals)/searchModal')}
						style={globalStyles.searchIcon}
					>
						<Icons.MagnifyingGlass
							size={27}
							color={colors.neutral200}
							weight="bold"
						/>
					</TouchableOpacity>
				</View>

				<ScrollView
					contentContainerStyle={globalStyles.scrollViewStyle}
					showsVerticalScrollIndicator={false}
				>
					<View>
						<HomeCard />
					</View>
					{/* <TransactionList
						data={recentTransactions}
						loading={transactionsLoading}
						filterByMonth={true}
						emptyListMessage="В цьому місяці ще немає тразакцій"
					/> */}
				</ScrollView>
			</View>
		</ScreenWrapper>
	);
};

export default Home;
