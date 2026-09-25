import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { ScrollView, TouchableOpacity, View } from 'react-native';

const days = Array.from({ length: 31 }, (_, i) => i + 1);

const MonthModal = () => {
	const { user, updateUser } = useAuth();

	const handleStartDayChange = async (day: number) => {
		if (!user?.uid) return;
		await updateUser(user.uid, { startOfMonth: day });
	};
	return (
		<ModalWrapper style={{ height: '70%' }}>
			<View style={[globalStyles.container]}>
				<Header title={'Поч.фін.місяця'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.modalForm} keyboardShouldPersistTaps="handled">
					<View style={{ gap: 15, paddingHorizontal: 6 }}>
						<View style={globalStyles.settingsDaysGrid}>
							{days.map((day) => {
								const isSelected = user?.startOfMonth === day || (!user?.startOfMonth && day === 1);

								return (
									<TouchableOpacity
										key={day}
										onPress={() => handleStartDayChange(day)}
										style={[
											globalStyles.settingsDayButton,
											isSelected && { backgroundColor: colors.primaryLight },
										]}
									>
										<Typo
											fontWeight={isSelected ? '700' : '400'}
											color={isSelected ? colors.black : colors.neutral200}
										>
											{day}
										</Typo>
									</TouchableOpacity>
								);
							})}
						</View>

						<Typo size={13} color={colors.neutral400}>
							Ваш місячний бюджет та статистика будуть розраховуватися з {user?.startOfMonth || 1}-го
							числа по {user?.startOfMonth ? user.startOfMonth - 1 : 31}-е число наступного місяця.
						</Typo>
					</View>
				</ScrollView>
			</View>
		</ModalWrapper>
	);
};

export default MonthModal;
