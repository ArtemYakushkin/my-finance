import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { showErrorToast } from '@/utils/showToast';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const currencies = [
	{ label: 'Гривня', value: 'UAH', symbol: '₴' },
	{ label: 'Долар', value: 'USD', symbol: '$' },
	{ label: 'Євро', value: 'EUR', symbol: '€' },
];

const CurrencyModal = () => {
	const { user, updateUser } = useAuth();
	const router = useRouter();

	const handleCurrencyChange = async (currencyValue: string) => {
		if (!user?.uid) return;
		const res = await updateUser(user.uid, { currency: currencyValue });
		if (res.success) {
			router.replace('/(modals)/settingsModal');
		} else {
			showErrorToast('Не вдалося оновити валюту');
		}
	};

	return (
		<ModalWrapper style={{ height: '70%' }}>
			<View style={[globalStyles.container]}>
				<Header title={'Валюта'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.modalForm} keyboardShouldPersistTaps="handled">
					<View>
						<View style={globalStyles.profileOptions}>
							{currencies.map((item, index) => {
								const isLast = index === currencies.length - 1;
								return (
									<>
										<TouchableOpacity
											key={item.value}
											style={[
												globalStyles.profileOptionsItem,
												{
													paddingVertical: 15,
													flexDirection: 'row',
													alignItems: 'center',
													justifyContent: 'space-between',
												},
											]}
											onPress={() => handleCurrencyChange(item.value)}
										>
											<View style={globalStyles.settingsInfo}>
												<Typo size={18} fontWeight="600">
													{item.symbol} - {item.label}
												</Typo>
											</View>
											{user?.currency === item.value && (
												<Icons.CheckCircle
													size={28}
													color={colors.primaryLight}
													weight="fill"
												/>
											)}
										</TouchableOpacity>

										{!isLast && <View style={globalStyles.profileOptionsSeparator} />}
									</>
								);
							})}
						</View>
					</View>
				</ScrollView>
			</View>
		</ModalWrapper>
	);
};

export default CurrencyModal;
