import { globalStyles } from '@/constants/global';
import { MAIN_GRADIENT } from '@/constants/gradient';
import { SHADOW_OPTIONS } from '@/constants/shadow';
import { colors } from '@/constants/theme';

import { transactionService } from '@/services/transactionService';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'phosphor-react-native';
import { Alert, Dimensions, View } from 'react-native';
import Modal from 'react-native-modal';
import { Shadow } from 'react-native-shadow-2';
import { categoryGroups, TransactionType } from '../constants/types';
import BackBtnModal from './BackBtnModal';
import Button from './Button';
import Header from './Header';
import Typo from './Typo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type Props = {
	visible: boolean;
	onClose: () => void;
	transaction: TransactionType | null;
	categories: any[];
	wallets: any[];
	onEdit: (tx: TransactionType) => void;
};

const TransactionDetailModal = ({ visible, onClose, transaction, categories, wallets, onEdit }: Props) => {
	if (!transaction) return null;

	// --- МАППИНГ КОШЕЛЬКОВ СТРОГО ПО ID ---
	const sourceWalletObj = wallets?.find((w) => w.id === transaction.walletId || w.id === transaction.fromWalletId);
	const sourceWalletName = sourceWalletObj ? sourceWalletObj.name : 'Невідомий гаманець';

	const targetWalletObj = wallets?.find((w) => w.id === transaction.toWalletId);
	const targetWalletName = targetWalletObj ? targetWalletObj.name : 'Невідомий гаманець';

	// --- МАППИНГ КАТЕГОРИЙ (Основная группа и Подкатегория) ---
	const mainGroupObj = categoryGroups?.find((g) => g.value === transaction.categoryGroup);
	const mainGroupLabel = mainGroupObj ? mainGroupObj.label : 'Інше';

	const subCategoryObj = categories?.find((c) => c.id === transaction.category);
	const subCategoryLabel = subCategoryObj
		? subCategoryObj.name || subCategoryObj.label
		: transaction.category || 'Невідома підкатегорія';

	const typeLabels = {
		income: { label: 'Дохід', color: colors.primary },
		expense: { label: 'Витрата', color: colors.rose },
		transfer: { label: 'Переказ', color: colors.primaryLight },
	};

	// Форматирование даты
	const formattedDate =
		transaction.date && (transaction.date as any).seconds
			? new Date((transaction.date as any).seconds * 1000).toLocaleDateString('uk-UA', {
					hour: '2-digit',
					minute: '2-digit',
				})
			: new Date(transaction.date as any).toLocaleDateString('uk-UA');

	const handleDelete = () => {
		Alert.alert('Видалити транзакцію?', 'Суму операції та загальну аналітику буде перераховано.', [
			{ text: 'Скасувати', style: 'cancel' },
			{
				text: 'Видалити',
				style: 'destructive',
				onPress: async () => {
					try {
						// Вызываем централизованный метод удаления из сервиса
						await transactionService.deleteTransaction(transaction.id, transaction);
						onClose();
					} catch (error) {
						console.error('Помилка при видаленні транзакції:', error);
						Alert.alert('Помилка', 'Не вдалося видалити транзакцію та оновити аналітику.');
					}
				},
			},
		]);
	};

	return (
		<Modal
			isVisible={visible}
			onBackdropPress={onClose}
			onBackButtonPress={onClose}
			swipeDirection="down"
			onSwipeComplete={onClose}
			propagateSwipe={true}
			style={globalStyles.calcModal}
			animationIn="slideInUp"
			animationOut="slideOutDown"
			backdropOpacity={0.7}
			deviceHeight={SCREEN_HEIGHT}
		>
			<LinearGradient
				{...(MAIN_GRADIENT as any)}
				style={[globalStyles.calcContainer, { height: SCREEN_HEIGHT * 0.95 }]}
			>
				<View style={globalStyles.calcHandle} />

				<Header title={'Деталі транзакції'} leftIcon={<BackBtnModal onPress={onClose} />} />

				<View style={{ paddingHorizontal: 10, marginTop: 20 }}>
					<Shadow {...SHADOW_OPTIONS.light} style={{ borderRadius: 20 }}>
						<Shadow {...SHADOW_OPTIONS.dark} style={{ borderRadius: 20 }}>
							<View style={globalStyles.profileOptions}>
								<View style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}>
									<Typo size={16} color={colors.neutral400}>
										Тип:
									</Typo>
									<Typo size={16} fontWeight="600" color={typeLabels[transaction.type].color}>
										{typeLabels[transaction.type].label}
									</Typo>
								</View>

								<View style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}>
									<Typo size={16} color={colors.neutral400}>
										{transaction.type === 'transfer' ? 'З гаманця:' : 'Гаманець:'}
									</Typo>
									<Typo size={16} fontWeight="600" color={colors.neutral100}>
										{sourceWalletName}
									</Typo>
								</View>

								{transaction.type === 'transfer' && (
									<View
										style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}
									>
										<Typo size={16} color={colors.neutral400}>
											На гаманець:
										</Typo>
										<Typo size={16} fontWeight="600" color={colors.neutral100}>
											{targetWalletName}
										</Typo>
									</View>
								)}

								{transaction.type === 'expense' && (
									<>
										<View
											style={[
												globalStyles.profileOptionsItem,
												{ justifyContent: 'space-between' },
											]}
										>
											<Typo size={16} color={colors.neutral400}>
												Категорія (Група):
											</Typo>
											<Typo size={16} fontWeight="600" color={colors.neutral100}>
												{mainGroupLabel}
											</Typo>
										</View>

										<View
											style={[
												globalStyles.profileOptionsItem,
												{ justifyContent: 'space-between' },
											]}
										>
											<Typo size={16} color={colors.neutral400}>
												Підкатегорія:
											</Typo>
											<Typo size={16} fontWeight="600" color={colors.neutral100}>
												{subCategoryLabel}
											</Typo>
										</View>
									</>
								)}

								<View style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}>
									<Typo size={16} color={colors.neutral400}>
										Сума:
									</Typo>
									<Typo fontWeight="700" size={18} color={typeLabels[transaction.type].color}>
										{transaction.amount} ₴
									</Typo>
								</View>

								<View style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}>
									<Typo size={16} color={colors.neutral400}>
										Дата:
									</Typo>
									<Typo size={16} fontWeight="600" color={colors.neutral100}>
										{formattedDate}
									</Typo>
								</View>

								{transaction.description ? (
									<View
										style={[
											globalStyles.profileOptionsItem,
											{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
										]}
									>
										<Typo size={16} color={colors.neutral400}>
											Опис:
										</Typo>
										<Typo size={15} color={colors.neutral200} style={{ marginTop: 2 }}>
											{transaction.description}
										</Typo>
									</View>
								) : null}
							</View>
						</Shadow>
					</Shadow>
				</View>

				{/* <View style={{ marginTop: 'auto', flexDirection: 'row' }}> */}
				<View style={[globalStyles.modalFooter, { marginTop: 'auto' }]}>
					<Button style={{ marginRight: 5 }} onPress={handleDelete}>
						<Icons.Trash color={colors.rose} size={24} weight="bold" />
					</Button>

					<Button
						onPress={() => {
							onClose();
							onEdit(transaction);
						}}
						style={{ flex: 1 }}
					>
						<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
							Редагувати
						</Typo>
					</Button>
				</View>
			</LinearGradient>
		</Modal>
	);
};

export default TransactionDetailModal;
