import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { globalStyles } from '@/constants/global';
import { SHADOW_OPTIONS } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { categoryGroups, TransactionType } from '@/constants/types';
import { transactionService } from '@/services/transactionService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { Shadow } from 'react-native-shadow-2';

const DetailModal = () => {
	const router = useRouter();
	const params = useLocalSearchParams<{ txData?: string; categories?: string; wallets?: string }>();

	const [transaction, setTransaction] = useState<TransactionType | null>(null);
	const [categories, setCategories] = useState<any[]>([]);
	const [wallets, setWallets] = useState<any[]>([]);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (params.txData) {
			try {
				setTransaction(JSON.parse(params.txData));
			} catch (e) {
				console.error('Помилка парсингу транзакції:', e);
			}
		}
		if (params.categories) {
			try {
				setCategories(JSON.parse(params.categories));
			} catch (e) {}
		}
		if (params.wallets) {
			try {
				setWallets(JSON.parse(params.wallets));
			} catch (e) {}
		}
	}, [params.txData, params.categories, params.wallets]);

	if (!transaction) return null;

	const sourceWalletObj = wallets?.find((w) => w.id === transaction.walletId || w.id === transaction.fromWalletId);
	const sourceWalletName = sourceWalletObj ? sourceWalletObj.name : 'Невідомий гаманець';
	const targetWalletObj = wallets?.find((w) => w.id === transaction.toWalletId);
	const targetWalletName = targetWalletObj ? targetWalletObj.name : 'Невідомий гаманець';
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

	const formattedDate =
		transaction.date && (transaction.date as any).seconds
			? new Date((transaction.date as any).seconds * 1000).toLocaleDateString('uk-UA', {
					hour: '2-digit',
					minute: '2-digit',
				})
			: new Date(transaction.date as any).toLocaleDateString('uk-UA');

	const handleConfirmDelete = async () => {
		setConfirmVisible(false);
		setLoading(true);
		try {
			await transactionService.deleteTransaction(transaction.id, transaction);
			showMessage({
				message: 'Успішно',
				description: 'Транзакцію видалено',
				type: 'success',
				backgroundColor: colors.gradientMid,
				color: colors.primaryLight,
			});
			router.back();
		} catch (error) {
			console.error('Помилка при видаленні транзакції:', error);
			showMessage({
				message: 'Помилка',
				description: 'Не вдалося видалити транзакцію та оновити аналітику.',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleEditPress = () => {
		router.replace({
			pathname: '/transaction',
			params: { editData: JSON.stringify(transaction) },
		});
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
				<Header title={'Деталі транзакції'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.modalForm} keyboardShouldPersistTaps="handled">
					<View style={{ paddingHorizontal: 10, marginTop: 20 }}>
						<Shadow {...SHADOW_OPTIONS.light} style={{ borderRadius: 20 }}>
							<Shadow {...SHADOW_OPTIONS.dark} style={{ borderRadius: 20 }}>
								<View style={globalStyles.profileOptions}>
									<View
										style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}
									>
										<Typo size={16} color={colors.neutral400}>
											Тип:
										</Typo>
										<Typo size={16} fontWeight="600" color={typeLabels[transaction.type].color}>
											{typeLabels[transaction.type].label}
										</Typo>
									</View>

									<View
										style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}
									>
										<Typo size={16} color={colors.neutral400}>
											{transaction.type === 'transfer' ? 'З гаманця:' : 'Гаманець:'}
										</Typo>
										<Typo size={16} fontWeight="600" color={colors.neutral100}>
											{sourceWalletName}
										</Typo>
									</View>

									{transaction.type === 'transfer' && (
										<View
											style={[
												globalStyles.profileOptionsItem,
												{ justifyContent: 'space-between' },
											]}
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

									<View
										style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}
									>
										<Typo size={16} color={colors.neutral400}>
											Сума:
										</Typo>
										<Typo fontWeight="700" size={18} color={typeLabels[transaction.type].color}>
											{transaction.amount} ₴
										</Typo>
									</View>

									<View
										style={[globalStyles.profileOptionsItem, { justifyContent: 'space-between' }]}
									>
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
				</ScrollView>

				<View style={globalStyles.modalFooter}>
					<Button style={{ marginRight: 5 }} onPress={() => setConfirmVisible(true)}>
						<Icons.Trash color={colors.rose} size={24} weight="bold" />
					</Button>

					<Button onPress={handleEditPress} style={{ flex: 1 }}>
						<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
							Редагувати
						</Typo>
					</Button>
				</View>
			</View>

			<ConfirmModal
				visible={confirmVisible}
				title="Видалити транзакцію?"
				message="Суму операції та загальну аналітику буде перераховано."
				confirmText="Видалити"
				cancelText="Скасувати"
				onConfirm={handleConfirmDelete}
				onCancel={() => setConfirmVisible(false)}
			/>
		</ModalWrapper>
	);
};

export default DetailModal;
