import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { categoryGroups, TransactionType } from '@/constants/types';
import { useAuth } from '@/context/useAuth';
import { getCurrencySymbol } from '@/utils/common';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Loading from './Loading';
import TransactionDetailModal from './TransactionDetailModal';
import Typo from './Typo';

type TransactionItemProps = {
	item: TransactionType;
	index: number;
	handleClick: (item: TransactionType) => void;
	categories: any[];
	wallets: any[]; // Добавлено сюда, чтобы мапить кошельки прямо в строке (опционально)
};

type TransactionListType = {
	data: TransactionType[];
	categories: any[];
	wallets: any[];
	title?: string;
	loading?: boolean;
	emptyListMessage?: string;
	filterByMonth?: boolean;
};

const TransactionList = ({
	data,
	loading,
	emptyListMessage,
	filterByMonth = false,
	categories,
	wallets, // Убрали дефолтный деструктуризатор [], чтобы видеть если родитель ничего не прислал
}: TransactionListType) => {
	const router = useRouter();

	const [selectedTx, setSelectedTx] = useState<TransactionType | null>(null);
	const [modalVisible, setModalVisible] = useState(false);

	const finalData = filterByMonth
		? data.filter((item) => {
				const transactionDate =
					item.date instanceof Timestamp ? item.date.toDate() : new Date(item.date as any);
				if (!transactionDate) return false;
				const now = new Date();
				return (
					transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear()
				);
			})
		: data;

	const handleClick = (item: TransactionType) => {
		setSelectedTx(item);
		setModalVisible(true);
	};

	const handleEditPress = (tx: TransactionType) => {
		setModalVisible(false);
		router.push({
			pathname: '/transaction',
			params: { editData: JSON.stringify(tx) },
		});
	};

	return (
		<View style={{ flex: 1, minHeight: 50 }}>
			<FlashList
				data={finalData}
				renderItem={({ item, index }) => (
					<TransactionItem
						item={item}
						index={index}
						categories={categories}
						wallets={wallets}
						handleClick={handleClick}
					/>
				)}
			/>

			{!loading && finalData.length === 0 && (
				<Typo size={15} color={colors.neutral400} style={{ textAlign: 'center', marginTop: 15 }}>
					{emptyListMessage}
				</Typo>
			)}

			{loading && (
				<View style={{ marginTop: 40, alignItems: 'center' }}>
					<Loading />
				</View>
			)}

			<TransactionDetailModal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				transaction={selectedTx}
				categories={categories}
				wallets={wallets}
				onEdit={handleEditPress}
			/>
		</View>
	);
};

const TransactionItem = ({ item, index, handleClick, categories, wallets }: TransactionItemProps) => {
	const { user } = useAuth();
	const currencySymbol = getCurrencySymbol(user?.currency);

	const getCategoryInfo = () => {
		if (item?.type === 'income') {
			return {
				groupLabel: 'Дохід',
				data: { label: item.category || 'Надходження', icon: Icons.ArrowDownLeft, bgColor: colors.primary },
			};
		}

		if (item?.type === 'transfer') {
			// Для отображения кошельков прямо в строке списка (опционально)
			const fromW = wallets?.find((w) => w.id === item.fromWalletId)?.name || '...';
			const toW = wallets?.find((w) => w.id === item.toWalletId)?.name || '...';
			return {
				groupLabel: 'Переказ',
				data: { label: `${fromW} → ${toW}`, icon: Icons.ArrowsLeftRight, bgColor: colors.neutral500 },
			};
		}

		const mainGroup = categoryGroups?.find((g) => g.value === item.categoryGroup);
		const dbCategory = categories?.find((c) => c.id === item.category);
		const subCategoryLabel = dbCategory ? dbCategory.name || dbCategory.label : 'Невідомо';

		if (mainGroup) {
			return {
				groupLabel: mainGroup.label,
				data: {
					label: subCategoryLabel,
					icon: mainGroup.icon,
					bgColor: mainGroup.color,
				},
			};
		}

		return {
			groupLabel: 'Інше',
			data: {
				label: subCategoryLabel,
				icon: Icons.Question,
				bgColor: colors.neutral600,
			},
		};
	};

	const { groupLabel, data: category } = getCategoryInfo();
	const IconComponent = category.icon;

	const rawDate = item?.date instanceof Timestamp ? item.date.toDate() : new Date(item?.date as any);
	const dateStr = rawDate?.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' }) || '';

	const getAmountStyles = () => {
		if (item?.type === 'income') return { color: colors.primary, prefix: '+' };
		if (item?.type === 'transfer') return { color: colors.neutral200, prefix: '' };
		return { color: colors.rose, prefix: '-' };
	};

	const { color: amountColor, prefix: amountPrefix } = getAmountStyles();

	return (
		<View style={{ marginBottom: 12 }}>
			<Pressable onPress={() => handleClick(item)}>
				<BlurView intensity={25} tint="dark" style={globalStyles.transRow}>
					<View style={[globalStyles.transIcon, { backgroundColor: category.bgColor }]}>
						{IconComponent && <IconComponent size={22} weight="fill" color={colors.white} />}
					</View>

					<View style={globalStyles.transCategoryDes}>
						<Typo size={16} fontWeight={'600'}>
							{item?.type === 'income' || item?.type === 'transfer'
								? category.label
								: `${groupLabel} / ${category.label}`}
						</Typo>
						<Typo size={12} color={colors.neutral400} textProps={{ numberOfLines: 1 }}>
							{item?.description || 'Немає опису'}
						</Typo>
					</View>

					<View style={globalStyles.transAmountDate}>
						<Typo fontWeight={'700'} color={amountColor}>
							{`${amountPrefix}${item?.amount} ${currencySymbol}`}
						</Typo>
						<Typo size={13} color={colors.neutral400}>
							{dateStr}
						</Typo>
					</View>
				</BlurView>
			</Pressable>
		</View>
	);
};

export default TransactionList;
