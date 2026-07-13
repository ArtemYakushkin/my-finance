import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { SHADOW_OPTIONS } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { Shadow } from 'react-native-shadow-2';

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
			router.replace('/settings');
		} else {
			Alert.alert('Помилка', 'не вдалося оновити валюту');
		}
	};

	return (
		<ModalWrapper style={{ height: '70%' }}>
			<View style={[globalStyles.container]}>
				<Header title={'Валюта'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.modalForm} keyboardShouldPersistTaps="handled">
					<View style={{ paddingHorizontal: 10 }}>
						<Shadow {...SHADOW_OPTIONS.light} style={{ borderRadius: 20 }}>
							<Shadow {...SHADOW_OPTIONS.dark} style={{ borderRadius: 20 }}>
								<View style={globalStyles.profileOptions}>
									{currencies.map((item) => (
										<TouchableOpacity
											key={item.value}
											style={globalStyles.settingsItem}
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
									))}
								</View>
							</Shadow>
						</Shadow>
					</View>
				</ScrollView>
			</View>
		</ModalWrapper>
	);
};

export default CurrencyModal;
