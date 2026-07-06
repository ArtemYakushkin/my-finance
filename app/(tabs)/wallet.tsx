import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import WalletItem from '@/components/WalletItem';
import { globalStyles } from '@/constants/global';
import { MAIN_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { getCurrencySymbol } from '@/utils/common';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { FlatList, TouchableOpacity, View } from 'react-native';

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

const Wallet = () => {
	const router = useRouter();
	const { user } = useAuth();
	const {
		data: wallets,
		error,
		loading,
	} = useFetchData<WalletType>(
		'wallets',
		user?.uid
			? [where('uid', '==', user?.uid), orderBy('created', 'desc')]
			: [],
	);

	const currencySymbol = getCurrencySymbol(user?.currency);

	const getTotalBalance = () =>
		wallets.reduce((total, item) => {
			total = total + (item.amount || 0);
			return total;
		}, 0);

	return (
		<ScreenWrapper>
			<View style={globalStyles.walletContainer}>
				<View style={globalStyles.walletBalance}>
					<View style={{ alignItems: 'center' }}>
						<Typo size={45} fontWeight={'500'}>
							{currencySymbol}
							{getTotalBalance()?.toFixed(2)}
						</Typo>
						<Typo size={16} color={colors.neutral500}>
							Загальний баланс
						</Typo>
					</View>
				</View>

				<LinearGradient
					{...(MAIN_GRADIENT as any)}
					style={globalStyles.walletBlock}
				>
					<View style={globalStyles.walletFlexRow}>
						<Typo size={20} fontWeight={'500'}>
							Мої гаманці
						</Typo>
						<TouchableOpacity
							onPress={() => router.push('/(modals)/walletModal')}
						>
							<Icons.PlusCircle
								weight="fill"
								color={colors.primaryLight}
								size={33}
							/>
						</TouchableOpacity>
					</View>

					<FlatList
						data={wallets}
						renderItem={({ item, index }) => (
							<WalletItem
								item={item}
								index={index}
								router={router}
							/>
						)}
						contentContainerStyle={{ paddingBottom: 25 }}
					/>
				</LinearGradient>
			</View>
		</ScreenWrapper>
	);
};

export default Wallet;
