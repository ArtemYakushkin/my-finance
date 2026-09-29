import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { createWallet, deleteWalletWithTransfer, updateWallet } from '@/services/walletService';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/showToast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

type WalletType = {
	id?: string;
	name: string;
	amount?: number;
	totalIncome?: number;
	totalExpenses?: number;
	image: any;
	uid?: string;
	created?: Date;
	isExcludedFromTotal?: boolean;
};

const WalletModal = () => {
	const { user } = useAuth();
	const router = useRouter();
	const oldWallet = useLocalSearchParams<{
		id: string;
		name: string;
		image: string;
		isExcludedFromTotal: string;
	}>();
	const [walletName, setWalletName] = useState('');
	const [walletImage, setWalletImage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [targetWallet, setTargetWallet] = useState<WalletType | null>(null);
	const [isExcludedFromTotal, setIsExcludedFromTotal] = useState(false);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const { data: allWallets } = useFetchData<WalletType>(
		'wallets',
		user?.uid ? [where('uid', '==', user.uid), orderBy('created', 'desc')] : [],
	);

	// Проверяем, существует ли уже кошелек, исключенный из баланса
	const existingExcludedWallet = allWallets.find((w) => w.isExcludedFromTotal && w.id !== oldWallet?.id);

	useEffect(() => {
		if (oldWallet?.id) {
			setWalletName(oldWallet.name || '');
			setWalletImage(oldWallet.image || null);
			setIsExcludedFromTotal(oldWallet.isExcludedFromTotal === 'true');
		}
	}, [oldWallet?.id]);

	const handleSubmit = async () => {
		if (!walletName.trim()) {
			showWarningToast('Будь ласка, введіть назву гаманця');
			return;
		}

		if (!user?.uid) return;

		setLoading(true);

		try {
			if (oldWallet?.id) {
				await updateWallet(oldWallet.id, walletName.trim(), walletImage, isExcludedFromTotal);
			} else {
				await createWallet({
					name: walletName.trim(),
					image: walletImage,
					uid: user.uid,
					isExcludedFromTotal,
				});
			}
			router.replace('/(tabs)/wallet');
		} catch (error: any) {
			showErrorToast('Помилка збереження');
		} finally {
			setLoading(false);
		}
	};

	const handleDeletePress = () => {
		if (!oldWallet?.id || !user?.uid) return;

		const fallbackWallet = allWallets.find((w) => w.id !== oldWallet.id);
		if (!fallbackWallet) {
			showWarningToast('Неможливо видалити єдиний гаманець. Створіть спочатку інший, щоб перенести транзакції');
			return;
		}

		setTargetWallet(fallbackWallet);
		setConfirmVisible(true);
	};

	const handleConfirmDelete = async () => {
		if (!oldWallet?.id || !user?.uid || !targetWallet?.id) return;

		setConfirmVisible(false);
		setLoading(true);

		try {
			await deleteWalletWithTransfer(oldWallet.id, user.uid, targetWallet.id);
			showSuccessToast('Гаманець видалено, транзакції перенесено');
			router.replace('/(tabs)/wallet');
		} catch (error: any) {
			showErrorToast('Помилка при видаленні');
		} finally {
			setLoading(false);
			setTargetWallet(null);
		}
	};

	const handleToggleCheckbox = () => {
		if (!isExcludedFromTotal && existingExcludedWallet) {
			showWarningToast('Може бути лише один гаманець, який не враховуется в загальному балансі');
			return;
		}
		setIsExcludedFromTotal(!isExcludedFromTotal);
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
				<Header title={oldWallet?.id ? 'Оновити гаманець' : 'Новий гаманець'} leftIcon={<BackButton />} />
				<ScrollView contentContainerStyle={globalStyles.modalForm}>
					<View style={{ gap: 10 }}>
						<Typo color={colors.neutral200} size={16}>
							Назва гаманця
						</Typo>
						<Input placeholder="Назва гаманця" value={walletName} onChangeText={setWalletName} />
					</View>

					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: 20,
							marginTop: 20,
						}}
					>
						<TouchableOpacity onPress={handleToggleCheckbox}>
							<View
								style={{
									width: 30,
									height: 30,
									borderRadius: 6,
									borderWidth: 2,
									borderColor: isExcludedFromTotal ? colors.primaryLight : colors.neutral200,
									backgroundColor: isExcludedFromTotal ? colors.primaryLight : 'transparent',
									justifyContent: 'center',
									alignItems: 'center',
								}}
							>
								{isExcludedFromTotal && (
									<Icons.Check color={colors.neutral200} size={20} weight="bold" />
								)}
							</View>
						</TouchableOpacity>

						<View style={{ flex: 1 }}>
							<Typo color={colors.neutral200} size={16}>
								Не враховувати в загальному балансі
							</Typo>
							{existingExcludedWallet && !isExcludedFromTotal && (
								<Typo color={colors.neutral400} size={12}>
									У вас вже є резервний гаманець: "{existingExcludedWallet.name}"
								</Typo>
							)}
						</View>
					</View>
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				{oldWallet?.id && (
					<Button style={{ marginRight: 5, flex: 0.2 }} disabled={loading} onPress={handleDeletePress}>
						<Icons.Trash color={colors.rose} size={24} weight="bold" />
					</Button>
				)}
				<Button loading={loading} style={{ flex: 1 }} onPress={handleSubmit}>
					<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
						{oldWallet?.id ? 'Оновити' : 'Додати'}
					</Typo>
				</Button>
			</View>

			<ConfirmModal
				visible={confirmVisible}
				title="Видалення гаманця"
				message={`Ви впевнені, що хочете видалити гаманець "${oldWallet?.name}"? Всі його транзакції будуть автоматично перенесені на гаманець "${targetWallet?.name}".`}
				confirmText="Видалити"
				cancelText="Скасувати"
				onConfirm={handleConfirmDelete}
				onCancel={() => {
					setConfirmVisible(false);
					setTargetWallet(null);
				}}
			/>
		</ModalWrapper>
	);
};

export default WalletModal;
