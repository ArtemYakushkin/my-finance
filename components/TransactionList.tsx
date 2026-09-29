import { getGlobalStyles } from '@/constants/global';
import { categoryGroups, TransactionType } from '@/constants/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { getCurrencySymbol } from '@/utils/common';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { Pressable, View } from 'react-native';
import Loading from './Loading';
import Typo from './Typo';

type TransactionItemProps = {
	item: TransactionType;
	index: number;
	handleClick: (item: TransactionType) => void;
	categories: any[];
	wallets: any[];
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
	wallets,
}: TransactionListType) => {
	const router = useRouter();

	const { isDark, colors } = useTheme();

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
		router.push({
			pathname: '/(modals)/detailModal',
			params: {
				txData: JSON.stringify(item),
				categories: JSON.stringify(categories),
				wallets: JSON.stringify(wallets),
			},
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
				<Typo
					size={15}
					color={isDark ? colors.neutral400 : colors.neutral350}
					style={{ textAlign: 'center', marginTop: 15 }}
				>
					{emptyListMessage}
				</Typo>
			)}

			{loading && (
				<View style={{ marginTop: 40, alignItems: 'center' }}>
					<Loading />
				</View>
			)}
		</View>
	);
};

const TransactionItem = ({ item, index, handleClick, categories, wallets }: TransactionItemProps) => {
	const { user } = useAuth();
	const currencySymbol = getCurrencySymbol(user?.currency);

	const { isDark, colors } = useTheme();
	const globalStyles = getGlobalStyles(colors);

	const getCategoryInfo = () => {
		if (item?.type === 'income') {
			return {
				groupLabel: 'Дохід',
				data: { label: item.category || 'Надходження', icon: Icons.ArrowDownLeft, bgColor: colors.primary },
			};
		}

		if (item?.type === 'transfer') {
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
				<View style={globalStyles.transRow}>
					<View style={[globalStyles.transIcon, { backgroundColor: category.bgColor }]}>
						{IconComponent && (
							<IconComponent
								size={22}
								weight="fill"
								color={isDark ? colors.neutral100 : colors.neutral900}
							/>
						)}
					</View>

					<View style={globalStyles.transCategoryDes}>
						<Typo size={16} fontWeight={'600'} color={colors.neutral100}>
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
				</View>
			</Pressable>
		</View>
	);
};

export default TransactionList;
