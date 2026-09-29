import DefaultWalletImg from '@/assets/images/wallet.png';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { getCurrencySymbol } from '@/utils/common';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Router } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
	isExcludedFromTotal?: boolean; // Флаг эксклюзивного кошелька
	isExclusive?: boolean;
	isExcluded?: boolean;
};

const WalletItem = ({ item, index, router }: { item: WalletType; index: number; router: Router }) => {
	const { user } = useAuth();
	const currencySymbol = getCurrencySymbol(user?.currency);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const isExclusive = item?.isExcludedFromTotal || item?.isExclusive || item?.isExcluded;

	const openWallet = () => {
		router.push({
			pathname: '/(modals)/walletModal',
			params: { id: item?.id, name: item?.name, image: item?.image },
		});
	};

	const getWalletImage = (imageSource: any) => {
		if (!imageSource || imageSource === 'default_wallet') {
			return DefaultWalletImg; // Возвращает скомпилированный объект картинки
		}
		return imageSource; // Если там лежит https:// ссылка на Cloudinary/Firebase Storage
	};

	return (
		<Animated.View entering={FadeInDown.delay(index * 200).springify()}>
			<Pressable onPress={openWallet}>
				<BlurView intensity={25} tint="dark" style={globalStyles.walletItem}>
					<View style={globalStyles.walletImage}>
						<Image
							style={{ flex: 1 }}
							source={getWalletImage(item?.image)}
							contentFit="cover"
							transition={100}
						/>
					</View>
					<View style={globalStyles.walletName}>
						<Typo size={16} color={colors.neutral100}>
							{item?.name}
						</Typo>
						<Typo size={14} color={colors.neutral300}>
							{currencySymbol}
							{item?.amount}
						</Typo>
					</View>
					{isExclusive && (
						<Icons.Lock size={20} weight="bold" color={colors.neutral500} style={{ marginRight: 20 }} />
					)}
					<Icons.CaretRight size={20} weight="bold" color={colors.neutral100} />
				</BlurView>
			</Pressable>
		</Animated.View>
	);
};

export default WalletItem;

const styles = StyleSheet.create({});
