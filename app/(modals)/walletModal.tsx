import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import {
	createWallet,
	deleteWalletWithTransfer,
	updateWallet,
} from '@/services/walletService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

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

	// Загружаем список всех кошельков текущего пользователя, чтобы найти "предыдущий" в случае удаления
	const { data: allWallets } = useFetchData<WalletType>(
		'wallets',
		user?.uid
			? [where('uid', '==', user.uid), orderBy('created', 'desc')]
			: [],
	);

	// Заполняем форму, если открыли модал на редактирование
	useEffect(() => {
		if (oldWallet?.id) {
			setWalletName(oldWallet.name || '');
			setWalletImage(oldWallet.image || null);
		}
	}, [oldWallet?.id]);

	// Обработчик создания / обновления
	const handleSubmit = async () => {
		if (!walletName.trim()) {
			Alert.alert('Помилка', 'Будь ласка, введіть назву гаманця');
			return;
		}

		if (!user?.uid) return;

		setLoading(true);
		try {
			if (oldWallet?.id) {
				// Редактирование
				await updateWallet(
					oldWallet.id,
					walletName.trim(),
					walletImage,
				);
			} else {
				// Создание нового
				await createWallet({
					name: walletName.trim(),
					image: walletImage,
					uid: user.uid,
				});
			}
			router.replace('/(tabs)/wallet');
		} catch (error: any) {
			Alert.alert('Помилка збереження', error.message);
		} finally {
			setLoading(false);
		}
	};

	// Обработчик удаления
	const handleDelete = async () => {
		if (!oldWallet?.id || !user?.uid) return;

		// Ищем кошелек для переноса данных (любой другой кошелек пользователя)
		const fallbackWallet = allWallets.find((w) => w.id !== oldWallet.id);

		if (!fallbackWallet) {
			Alert.alert(
				'Увага',
				'Неможливо видалити єдиний гаманець. Створіть спочатку інший, щоб перенести транзакції.',
			);
			return;
		}

		Alert.alert(
			'Видалення гаманця',
			`Ви впевнені, що хочете видалити гаманець "${oldWallet.name}"? Всі його транзакції будуть автоматично перенесені на гаманець "${fallbackWallet.name}".`,
			[
				{ text: 'Скасувати', style: 'cancel' },
				{
					text: 'Видалити',
					style: 'destructive',
					onPress: async () => {
						setLoading(true);
						try {
							await deleteWalletWithTransfer(
								oldWallet.id,
								user.uid,
								fallbackWallet.id!,
							);
							router.replace('/(tabs)/wallet'); // Возвращаемся на главную страницу
						} catch (error: any) {
							Alert.alert('Помилка при видаленні', error.message);
						} finally {
							setLoading(false);
						}
					},
				},
			],
		);
	};

	return (
		<ModalWrapper>
			<View
				style={[
					globalStyles.container,
					{ justifyContent: 'space-between' },
				]}
			>
				<Header
					title={
						oldWallet?.id ? 'Оновити гаманець' : 'Новий гаманець'
					}
					leftIcon={<BackButton />}
				/>
				<ScrollView contentContainerStyle={globalStyles.modalForm}>
					<View style={{ gap: 10, paddingHorizontal: 5 }}>
						<Typo
							color={colors.neutral200}
							size={16}
							style={{ paddingLeft: 5 }}
						>
							Назва гаманця
						</Typo>
						<Input
							placeholder="Назва гаманця"
							value={walletName}
							onChangeText={setWalletName}
						/>
					</View>

					{/* <View style={{ gap: 10, paddingHorizontal: 5 }}> */}
					{/* <Typo
							color={colors.neutral200}
							size={16}
							style={{ paddingLeft: 5 }}
						>
							Значок гаманця
						</Typo>
						<Image
							source={
								walletImage === 'default_wallet' || !walletImage
									? DefaultWalletImg
									: walletImage
							}
							placeholder="Завантажити зображення"
						/> */}

					{/* Кнопка смены изображения (заглушка для последующего добавления ImagePicker)
						<TouchableOpacity
							style={{
								padding: 10,
								backgroundColor: colors.neutral800,
								borderRadius: 8,
							}}
							onPress={() => {
								// Здесь в будущем можно вызвать ImagePicker.
								// Сейчас просто оставим возможность сбросить или оставить дефолт.
								Alert.alert(
									'Зміна зображення',
									'Функціонал завантаження картинок з пристрою може бути інтегрований тут.',
								);
							}}
						>
							<Typo size={14} color={colors.neutral300}>
								Змінити значок
							</Typo>
						</TouchableOpacity> */}
					{/* </View> */}
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				{oldWallet?.id && (
					<Button
						style={{ marginRight: 5 }}
						disabled={loading}
						onPress={handleDelete}
					>
						<Icons.Trash
							color={colors.rose}
							size={24}
							weight="bold"
						/>
					</Button>
				)}
				<Button
					loading={loading}
					style={{ flex: 1 }}
					onPress={handleSubmit}
				>
					<Typo
						fontWeight={'700'}
						color={colors.primaryLight}
						size={21}
					>
						{oldWallet?.id ? 'Оновити' : 'Додати'}
					</Typo>
				</Button>
			</View>
		</ModalWrapper>
	);
};

export default WalletModal;
