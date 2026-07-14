import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { createWallet, deleteWalletWithTransfer, updateWallet } from '@/services/walletService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

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

const WalletModal = () => {
	const { user } = useAuth();
	const router = useRouter();
	const oldWallet = useLocalSearchParams<{
		id: string;
		name: string;
		image: string;
	}>();
	const [walletName, setWalletName] = useState('');
	const [walletImage, setWalletImage] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [targetWallet, setTargetWallet] = useState<WalletType | null>(null);

	const { data: allWallets } = useFetchData<WalletType>(
		'wallets',
		user?.uid ? [where('uid', '==', user.uid), orderBy('created', 'desc')] : [],
	);

	useEffect(() => {
		if (oldWallet?.id) {
			setWalletName(oldWallet.name || '');
			setWalletImage(oldWallet.image || null);
		}
	}, [oldWallet?.id]);

	const handleSubmit = async () => {
		if (!walletName.trim()) {
			showMessage({
				message: 'Помилка',
				description: 'Будь ласка, введіть назву гаманця',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}
		if (!user?.uid) return;
		setLoading(true);
		try {
			if (oldWallet?.id) {
				await updateWallet(oldWallet.id, walletName.trim(), walletImage);
			} else {
				await createWallet({
					name: walletName.trim(),
					image: walletImage,
					uid: user.uid,
				});
			}
			router.replace('/(tabs)/wallet');
		} catch (error: any) {
			showMessage({
				message: 'Помилка збереження',
				description: error.message,
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDeletePress = () => {
		if (!oldWallet?.id || !user?.uid) return;

		const fallbackWallet = allWallets.find((w) => w.id !== oldWallet.id);
		if (!fallbackWallet) {
			showMessage({
				message: 'Увага',
				description: 'Неможливо видалити єдиний гаманець. Створіть спочатку інший, щоб перенести транзакції',
				type: 'warning',
				backgroundColor: colors.gradientMid,
				color: colors.orange,
			});
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
			showMessage({
				message: 'Успішно',
				description: 'Гаманець видалено, транзакції перенесено',
				type: 'success',
				backgroundColor: colors.gradientMid,
				color: colors.primaryLight,
			});
			router.replace('/(tabs)/wallet');
		} catch (error: any) {
			showMessage({
				message: 'Помилка при видаленні',
				description: error.message,
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setLoading(false);
			setTargetWallet(null);
		}
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
				<Header title={oldWallet?.id ? 'Оновити гаманець' : 'Новий гаманець'} leftIcon={<BackButton />} />
				<ScrollView contentContainerStyle={globalStyles.modalForm}>
					<View style={{ gap: 10, paddingHorizontal: 5 }}>
						<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
							Назва гаманця
						</Typo>
						<Input placeholder="Назва гаманця" value={walletName} onChangeText={setWalletName} />
					</View>
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				{oldWallet?.id && (
					<Button style={{ marginRight: 5 }} disabled={loading} onPress={handleDeletePress}>
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
