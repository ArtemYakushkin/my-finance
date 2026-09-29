import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import Loading from '@/components/Loading';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { CurrencyItem, fetchPopularRates, getFlagUrl } from '@/services/nbuApi';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';

const ExchangeRateModal = () => {
	const [rates, setRates] = useState<CurrencyItem[]>([]);
	const [loading, setLoading] = useState(true);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	useEffect(() => {
		fetchPopularRates().then((data) => {
			setRates(data);
			setLoading(false);
		});
	}, []);

	const renderItem = ({ item }: { item: CurrencyItem }) => (
		<View
			style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}
		>
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<Image
					source={{ uri: getFlagUrl(item?.countryCode) }}
					style={{
						width: 40,
						height: 25,
					}}
					contentFit="cover"
				/>
				<View style={{ marginLeft: 12 }}>
					<Typo size={16} fontWeight="600" color={colors.neutral100}>
						{item.cc}
					</Typo>
					<Typo size={12} color={colors.neutral400}>
						{item.txt}
					</Typo>
				</View>
			</View>

			<View style={{ flexDirection: 'row', gap: 16 }}>
				<View style={{ alignItems: 'flex-end', minWidth: 55 }}>
					<Typo size={11} color={colors.neutral400}>
						Куп.
					</Typo>
					<Typo size={16} fontWeight="600" color={colors.neutral100}>
						{item.buyRate.toFixed(2)}
					</Typo>
				</View>
				<View style={{ alignItems: 'flex-end', minWidth: 55 }}>
					<Typo size={11} color={colors.neutral400}>
						Прод.
					</Typo>
					<Typo size={16} fontWeight="600" color={colors.neutral100}>
						{item.sellRate.toFixed(2)}
					</Typo>
				</View>
			</View>
		</View>
	);

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={'Курси валют (НБУ)'} leftIcon={<BackButton />} />
				{loading ? (
					<Loading />
				) : (
					<FlatList
						data={rates}
						keyExtractor={(item) => item.cc}
						renderItem={renderItem}
						contentContainerStyle={{ paddingBottom: 60 }}
						ItemSeparatorComponent={() => (
							<View style={{ height: 1, backgroundColor: colors.neutral500 }} />
						)}
					/>
				)}
			</View>
		</ModalWrapper>
	);
};

export default ExchangeRateModal;
