import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { showErrorToast, showInfoToast, showSuccessToast } from '@/utils/showToast';
import { deleteUser, getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useState } from 'react';
import { Image, Linking, ScrollView, Text, View } from 'react-native';

interface PrivacyPolicyScreenProps {
	onBack?: () => void;
	supportEmail?: string;
}

const deleteQueryBatch = async (q: ReturnType<typeof query>) => {
	const snapshot = await getDocs(q);
	if (snapshot.empty) return;

	const CHUNK_SIZE = 450;
	for (let i = 0; i < snapshot.docs.length; i += CHUNK_SIZE) {
		const batch = writeBatch(db);
		const chunk = snapshot.docs.slice(i, i + CHUNK_SIZE);
		chunk.forEach((docSnap) => {
			batch.delete(docSnap.ref);
		});
		await batch.commit();
	}
};

const deleteUserDataAndAccount = async (): Promise<{ success: boolean; error?: string }> => {
	const auth = getAuth();
	const currentUser = auth.currentUser;

	if (!currentUser) {
		return { success: false, error: 'Користувача не авторизовано' };
	}

	const uid = currentUser.uid;

	try {
		const transactionsQuery = query(collection(db, 'transactions'), where('uid', '==', uid));
		const walletsQuery = query(collection(db, 'wallets'), where('uid', '==', uid));
		const categoriesQuery = query(collection(db, 'categories'), where('uid', '==', uid));
		const plannedQuery = query(collection(db, 'planned_transactions'), where('uid', '==', uid));

		await deleteQueryBatch(transactionsQuery);
		await deleteQueryBatch(walletsQuery);
		await deleteQueryBatch(categoriesQuery);
		await deleteQueryBatch(plannedQuery);

		const userDocRef = doc(db, 'users', uid);
		await deleteDoc(userDocRef).catch(() => {});

		await deleteUser(currentUser);

		return { success: true };
	} catch (error: any) {
		if (error?.code === 'auth/requires-recent-login') {
			return {
				success: false,
				error: 'Для видалення акаунту потрібно повторно увійти в систему.',
			};
		}

		return {
			success: false,
			error: error?.message || 'Не вдалося видалити акаунт та дані.',
		};
	}
};

const PrivacyModal: React.FC<PrivacyPolicyScreenProps> = ({ supportEmail = 'artem.frontdeveloper@gmail.com' }) => {
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const handleContactSupport = async () => {
		const mailUrl = `mailto:${supportEmail}?subject=Запит щодо конфіденційності`;
		try {
			const canOpen = await Linking.canOpenURL(mailUrl);
			if (canOpen) {
				await Linking.openURL(mailUrl);
			} else {
				showInfoToast(`Напишіть нам на пошту: ${supportEmail}`);
			}
		} catch {
			showErrorToast('Не вдалося відкрити поштовий клієнт');
		}
	};

	const handleConfirmDelete = async () => {
		setIsDeleting(true);
		const result = await deleteUserDataAndAccount();
		setIsDeleting(false);
		setIsDeleteModalVisible(false);

		if (!result.success) {
			showErrorToast('Не вдалося видалити обліковий запис');
		} else {
			showSuccessToast("Ваш акаунт та всі пов'язані дані були успішно видалені");
		}
	};

	const logoDark = require('../../assets/images/LogoDeveloperWhite.png');
	const logoLight = require('../../assets/images/LogoDeveloperBlack.png');

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { flex: 1 }]}>
				<Header title={'Конфіденційність'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.statScrollContent} showsVerticalScrollIndicator={false}>
					<Text style={globalStyles.title}>Політика конфіденційності</Text>
					<Text style={globalStyles.updateDate}>Дата оновлення: 21 серпня 2026 р.</Text>

					<View style={globalStyles.section}>
						<Text style={globalStyles.paragraph}>
							Ця Політика конфіденційності описує, як наш додаток збирає, використовує та захищає
							персональну інформацію користувачів.
						</Text>
					</View>

					<View style={globalStyles.section}>
						<Text style={globalStyles.sectionTitle}>1. Збір та використання інформації</Text>
						<Text style={globalStyles.paragraph}>
							Для забезпечення роботи сервісу фінансового обліку ми збираємо наступні дані:
						</Text>
						<Text style={globalStyles.bulletPoint}>
							• <Text style={globalStyles.bold}>Дані акаунту:</Text> унікальний ідентифікатор (UID) та
							e-mail, що використовуються при авторизації через Firebase Authentication.
						</Text>
						<Text style={globalStyles.bulletPoint}>
							• <Text style={globalStyles.bold}>Контент користувача:</Text> інформацію про гаманці,
							транзакції (доходи, витрати, перекази), категорії та бюджети, створені користувачем.
						</Text>
					</View>

					<View style={globalStyles.section}>
						<Text style={globalStyles.sectionTitle}>2. Збереження та захист даних</Text>
						<Text style={globalStyles.paragraph}>
							Усі дані зберігаються в захищеній хмарній базі даних Google Firebase Cloud Firestore. Ми
							застосовуємо сучасні стандарти шифрування та правила безпеки (Security Rules), щоб
							унеможливити несанкціонований доступ до ваших фінансових записів.
						</Text>
					</View>

					<View style={globalStyles.section}>
						<Text style={globalStyles.sectionTitle}>3. Передача третім особам</Text>
						<Text style={globalStyles.paragraph}>
							Ми <Text style={globalStyles.bold}>не продаємо</Text>,{' '}
							<Text style={globalStyles.bold}>не передаємо</Text> і не розкриваємо ваші персональні або
							фінансові дані третім особам чи рекламним мережам.
						</Text>
					</View>

					<View style={globalStyles.section}>
						<Text style={globalStyles.sectionTitle}>4. Видалення даних та акаунту</Text>
						<Text style={globalStyles.paragraph}>
							Ви маєте право повністю видалити свій акаунт та всі пов'язані записи (гаманці, історії
							транзакцій, категорії) в будь-який момент через цей екран.
						</Text>
					</View>

					<View style={globalStyles.actionsContainer}>
						<Button onPress={handleContactSupport}>
							<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
								Написати в підтримку
							</Typo>
						</Button>

						<Button onPress={() => setIsDeleteModalVisible(true)}>
							<Typo fontWeight={'700'} color={colors.rose} size={21}>
								Видалити акаунт та дані
							</Typo>
						</Button>
					</View>

					<View style={{ marginBottom: 24, alignItems: 'center' }}>
						<Image
							style={{ width: 150, height: 'auto', paddingBottom: 72 }}
							resizeMode="contain"
							source={isDark ? logoDark : logoLight}
						/>
					</View>
				</ScrollView>
			</View>

			<ConfirmModal
				visible={isDeleteModalVisible}
				title="Видалити акаунт?"
				message="Ця дія безповоротна. Усі ваші гаманці, транзакції та налаштування будуть повністю видалені з бази даних."
				confirmText={isDeleting ? 'Видалення...' : 'Видалити'}
				cancelText="Скасувати"
				onConfirm={handleConfirmDelete}
				onCancel={() => setIsDeleteModalVisible(false)}
			/>
		</ModalWrapper>
	);
};

export default PrivacyModal;
