import { db } from '@/config/firebase';
import { colors } from '@/constants/theme';
import { ResponseType, TransactionType } from '@/constants/types';
import {
	collection,
	doc,
	getDocs,
	orderBy,
	query,
	runTransaction,
	serverTimestamp,
	Timestamp,
	where,
} from 'firebase/firestore';

export type TransactionData = {
	uid: string;
	type: 'expense' | 'income' | 'transfer';
	amount: number;
	walletId: string;
	targetWalletId?: string | null;
	toWalletId?: string;
	categoryGroup?: string;
	category?: string;
	date: Date;
	description?: string;
};

export const transactionService = {
	createTransaction: async (data: TransactionData) => {
		const transactionRef = doc(collection(db, 'transactions'));
		const walletRef = doc(db, 'wallets', data.walletId);

		// Определяем кошелек-получатель (для transfer или expense с targetWalletId)
		const targetId = data.targetWalletId || data.toWalletId || null;
		const targetWalletRef = targetId ? doc(db, 'wallets', targetId) : null;

		await runTransaction(db, async (ts) => {
			const walletSnap = await ts.get(walletRef);
			if (!walletSnap.exists()) {
				throw new Error('Основний гаманець не знайдено в системі');
			}

			const currentBalance = Number(walletSnap.data().amount || 0);
			const currentTotalIncome = Number(walletSnap.data().totalIncome || 0);
			const currentTotalExpenses = Number(walletSnap.data().totalExpenses || 0);

			let newBalance = currentBalance;
			let newTotalIncome = currentTotalIncome;
			let newTotalExpenses = currentTotalExpenses;

			let newTargetWalletBalance = 0;
			let newTargetWalletIncome = 0;

			if (data.type === 'expense') {
				if (currentBalance < data.amount) {
					throw new Error('Недостатньо коштів на гаманці для здійснення витрати');
				}
				newBalance = currentBalance - data.amount;
				newTotalExpenses = currentTotalExpenses + data.amount;

				// Если у расхода есть целевой кошелек (например, Резерв)
				if (targetWalletRef) {
					const targetSnap = await ts.get(targetWalletRef);
					if (targetSnap.exists()) {
						const targetBalance = Number(targetSnap.data().amount || 0);
						const targetIncome = Number(targetSnap.data().totalIncome || 0);
						newTargetWalletBalance = targetBalance + data.amount;
						newTargetWalletIncome = targetIncome + data.amount;
					}
				}
			} else if (data.type === 'income') {
				newBalance = currentBalance + data.amount;
				newTotalIncome = currentTotalIncome + data.amount;
			} else if (data.type === 'transfer') {
				if (!targetWalletRef) throw new Error('Не вказано цільовий гаманець для переказу');

				const targetSnap = await ts.get(targetWalletRef);
				if (!targetSnap.exists()) {
					throw new Error('Цільовий гаманець для переказу не знайдено');
				}
				if (currentBalance < data.amount) {
					throw new Error('Недостатньо коштів на гаманці для здійснення переказу');
				}

				const targetBalance = Number(targetSnap.data().amount || 0);
				const targetIncome = Number(targetSnap.data().totalIncome || 0);

				newBalance = currentBalance - data.amount;
				newTotalExpenses = currentTotalExpenses + data.amount;

				newTargetWalletBalance = targetBalance + data.amount;
				newTargetWalletIncome = targetIncome + data.amount;
			}

			ts.set(transactionRef, {
				...data,
				amount: Number(data.amount),
				targetWalletId: targetId,
				toWalletId: data.type === 'transfer' ? targetId : null,
				date: Timestamp.fromDate(data.date),
				createdAt: serverTimestamp(),
			});

			ts.update(walletRef, {
				amount: newBalance,
				totalIncome: newTotalIncome,
				totalExpenses: newTotalExpenses,
			});

			if (targetWalletRef) {
				ts.update(targetWalletRef, {
					amount: newTargetWalletBalance,
					totalIncome: newTargetWalletIncome,
				});
			}
		});
	},

	updateTransaction: async (txId: string, newData: any, oldData: any) => {
		const txRef = doc(db, 'transactions', txId);

		await runTransaction(db, async (ts) => {
			const oldWalletRef = doc(db, 'wallets', oldData.walletId);
			const newWalletRef = doc(db, 'wallets', newData.walletId);

			const oldTargetId = oldData.targetWalletId || oldData.toWalletId;
			const newTargetId = newData.targetWalletId || newData.toWalletId;

			const oldWalletSnap = await ts.get(oldWalletRef);
			const newWalletSnap = await ts.get(newWalletRef);

			let oldTargetSnap = null;
			if (oldTargetId) {
				oldTargetSnap = await ts.get(doc(db, 'wallets', oldTargetId));
			}

			let newTargetSnap = null;
			if (newTargetId) {
				newTargetSnap = await ts.get(doc(db, 'wallets', newTargetId));
			}

			// --- 1. Откатываем старую транзакцию ---
			let oldWBalance = oldWalletSnap.exists() ? Number(oldWalletSnap.data().amount || 0) : 0;
			let oldWIncome = oldWalletSnap.exists() ? Number(oldWalletSnap.data().totalIncome || 0) : 0;
			let oldWExpenses = oldWalletSnap.exists() ? Number(oldWalletSnap.data().totalExpenses || 0) : 0;

			if (oldWalletSnap.exists()) {
				if (oldData.type === 'expense') {
					oldWBalance += Number(oldData.amount);
					oldWExpenses -= Number(oldData.amount);

					if (oldTargetSnap && oldTargetSnap.exists()) {
						ts.update(doc(db, 'wallets', oldTargetId), {
							amount: Number(oldTargetSnap.data().amount || 0) - Number(oldData.amount),
							totalIncome: Number(oldTargetSnap.data().totalIncome || 0) - Number(oldData.amount),
						});
					}
				} else if (oldData.type === 'income') {
					oldWBalance -= Number(oldData.amount);
					oldWIncome -= Number(oldData.amount);
				} else if (oldData.type === 'transfer') {
					oldWBalance += Number(oldData.amount);
					oldWExpenses -= Number(oldData.amount);

					if (oldTargetSnap && oldTargetSnap.exists()) {
						ts.update(doc(db, 'wallets', oldTargetId), {
							amount: Number(oldTargetSnap.data().amount || 0) - Number(oldData.amount),
							totalIncome: Number(oldTargetSnap.data().totalIncome || 0) - Number(oldData.amount),
						});
					}
				}
			}

			// --- 2. Применяем новую транзакцию ---
			let newWBalance =
				oldData.walletId === newData.walletId
					? oldWBalance
					: newWalletSnap.exists()
						? Number(newWalletSnap.data().amount || 0)
						: 0;

			let newWIncome =
				oldData.walletId === newData.walletId
					? oldWIncome
					: newWalletSnap.exists()
						? Number(newWalletSnap.data().totalIncome || 0)
						: 0;

			let newWExpenses =
				oldData.walletId === newData.walletId
					? oldWExpenses
					: newWalletSnap.exists()
						? Number(newWalletSnap.data().totalExpenses || 0)
						: 0;

			if (newData.type === 'expense') {
				if (newWBalance < Number(newData.amount)) throw new Error('Недостатньо коштів на гаманці');
				newWBalance -= Number(newData.amount);
				newWExpenses += Number(newData.amount);

				if (newTargetId) {
					if (!newTargetSnap || !newTargetSnap.exists()) throw new Error('Цільовий гаманець не знайдено');

					// Если целевой кошелек совпадает со старым целевым, берем его свежий пересчитанный баланс
					const baseAmount =
						oldTargetId === newTargetId && oldTargetSnap?.exists()
							? Number(oldTargetSnap.data().amount || 0) - Number(oldData.amount)
							: Number(newTargetSnap.data().amount || 0);

					const baseIncome =
						oldTargetId === newTargetId && oldTargetSnap?.exists()
							? Number(oldTargetSnap.data().totalIncome || 0) - Number(oldData.amount)
							: Number(newTargetSnap.data().totalIncome || 0);

					ts.update(doc(db, 'wallets', newTargetId), {
						amount: baseAmount + Number(newData.amount),
						totalIncome: baseIncome + Number(newData.amount),
					});
				}
			} else if (newData.type === 'income') {
				newWBalance += Number(newData.amount);
				newWIncome += Number(newData.amount);
			} else if (newData.type === 'transfer') {
				if (newWBalance < Number(newData.amount)) throw new Error('Недостатньо коштів для переказу');
				newWBalance -= Number(newData.amount);
				newWExpenses += Number(newData.amount);

				if (!newTargetSnap || !newTargetSnap.exists()) throw new Error('Цільовий гаманець не знайдено');

				const baseAmount =
					oldTargetId === newTargetId && oldTargetSnap?.exists()
						? Number(oldTargetSnap.data().amount || 0) - Number(oldData.amount)
						: Number(newTargetSnap.data().amount || 0);

				const baseIncome =
					oldTargetId === newTargetId && oldTargetSnap?.exists()
						? Number(oldTargetSnap.data().totalIncome || 0) - Number(oldData.amount)
						: Number(newTargetSnap.data().totalIncome || 0);

				ts.update(doc(db, 'wallets', newTargetId), {
					amount: baseAmount + Number(newData.amount),
					totalIncome: baseIncome + Number(newData.amount),
				});
			}

			// Обновляем исходные кошельки
			if (oldData.walletId !== newData.walletId) {
				if (oldWalletSnap.exists()) {
					ts.update(oldWalletRef, {
						amount: oldWBalance,
						totalIncome: oldWIncome,
						totalExpenses: oldWExpenses,
					});
				}
			}

			if (newWalletSnap.exists()) {
				ts.update(newWalletRef, {
					amount: newWBalance,
					totalIncome: newWIncome,
					totalExpenses: newWExpenses,
				});
			}

			// Полезная нагрузка для документа транзакции
			const updatePayload: any = {
				type: newData.type,
				amount: Number(newData.amount),
				walletId: newData.walletId,
				targetWalletId: newTargetId || null,
				date: Timestamp.fromDate(newData.date),
				description: newData.description || '',
			};

			if (newData.type === 'expense') {
				updatePayload.categoryGroup = newData.categoryGroup || '';
				updatePayload.category = newData.category || '';
				updatePayload.toWalletId = null;
			} else if (newData.type === 'income') {
				updatePayload.categoryGroup = null;
				updatePayload.category = null;
				updatePayload.toWalletId = null;
			} else if (newData.type === 'transfer') {
				updatePayload.toWalletId = newTargetId;
				updatePayload.categoryGroup = null;
				updatePayload.category = null;
			}

			ts.update(txRef, updatePayload);
		});
	},

	deleteTransaction: async (txId: string, oldData: any) => {
		const txRef = doc(db, 'transactions', txId);
		const walletRef = doc(db, 'wallets', oldData.walletId);
		const targetId = oldData.targetWalletId || oldData.toWalletId;

		await runTransaction(db, async (ts) => {
			const walletSnap = await ts.get(walletRef);
			if (!walletSnap.exists()) throw new Error('Гаманець не знайдено');

			let balance = Number(walletSnap.data().amount || 0);
			let totalIncome = Number(walletSnap.data().totalIncome || 0);
			let totalExpenses = Number(walletSnap.data().totalExpenses || 0);
			const amount = Number(oldData.amount || 0);

			if (oldData.type === 'expense') {
				balance += amount;
				totalExpenses -= amount;

				if (targetId) {
					const targetWalletRef = doc(db, 'wallets', targetId);
					const targetSnap = await ts.get(targetWalletRef);
					if (targetSnap.exists()) {
						ts.update(targetWalletRef, {
							amount: Number(targetSnap.data().amount || 0) - amount,
							totalIncome: Number(targetSnap.data().totalIncome || 0) - amount,
						});
					}
				}
			} else if (oldData.type === 'income') {
				balance -= amount;
				totalIncome -= amount;
			} else if (oldData.type === 'transfer') {
				balance += amount;
				totalExpenses -= amount;

				if (targetId) {
					const targetWalletRef = doc(db, 'wallets', targetId);
					const targetSnap = await ts.get(targetWalletRef);
					if (targetSnap.exists()) {
						ts.update(targetWalletRef, {
							amount: Number(targetSnap.data().amount || 0) - amount,
							totalIncome: Number(targetSnap.data().totalIncome || 0) - amount,
						});
					}
				}
			}

			ts.update(walletRef, {
				amount: balance,
				totalIncome: totalIncome,
				totalExpenses: totalExpenses,
			});

			ts.delete(txRef);
		});
	},
};

export const fetchMonthStats = async (uid: string, selectedDate: Date): Promise<ResponseType> => {
	try {
		const year = selectedDate.getFullYear();
		const month = selectedDate.getMonth();

		const startOfMonth = new Date(year, month, 1);
		const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

		const transactionsQuery = query(
			collection(db, 'transactions'),
			where('uid', '==', uid),
			where('date', '>=', Timestamp.fromDate(startOfMonth)),
			where('date', '<=', Timestamp.fromDate(endOfMonth)),
			orderBy('date', 'desc'),
		);

		const querySnapshot = await getDocs(transactionsQuery);

		const monthsOfYear = [
			'Січ',
			'Лют',
			'Бер',
			'Квіт',
			'Трав',
			'Черв',
			'Лип',
			'Серп',
			'Вер',
			'Жовт',
			'Лист',
			'Груд',
		];

		const monthlyData: { month: string; key: string; income: number; expense: number }[] = [];

		for (let i = 0; i < 12; i++) {
			monthlyData.push({
				month: `${monthsOfYear[i]} ${year.toString().slice(-2)}`,
				key: `${year}-${i}`,
				income: 0,
				expense: 0,
			});
		}

		const transactions: TransactionType[] = [];
		querySnapshot.forEach((doc) => {
			const transaction = doc.data() as TransactionType;
			transaction.id = doc.id;
			transactions.push(transaction);

			const date = (transaction.date as Timestamp).toDate();
			const transactionKey = `${date.getFullYear()}-${date.getMonth()}`;
			const monthData = monthlyData.find((m) => m.key === transactionKey);

			if (monthData) {
				if (transaction.type === 'income') monthData.income += Number(transaction.amount);
				else monthData.expense += Number(transaction.amount);
			}
		});

		const stats = monthlyData
			.filter((m) => m.income > 0 || m.expense > 0 || m.key === `${year}-${month}`)
			.flatMap((month) => [
				{
					value: month.income,
					label: month.month,
					spacing: 4,
					labelWidth: 46,
					frontColor: colors.primaryLight,
				},
				{ value: month.expense, frontColor: colors.rose },
			]);

		return { success: true, data: { stats, transactions } };
	} catch (error: any) {
		return { success: false, msg: error.message };
	}
};

export const fetchYearStats = async (uid: string, selectedDate: Date): Promise<ResponseType> => {
	try {
		const year = selectedDate.getFullYear();
		const startOfYear = new Date(year, 0, 1);
		const endOfYear = new Date(year, 11, 31, 23, 59, 59);

		const transactionsQuery = query(
			collection(db, 'transactions'),
			where('uid', '==', uid),
			where('date', '>=', Timestamp.fromDate(startOfYear)),
			where('date', '<=', Timestamp.fromDate(endOfYear)),
			orderBy('date', 'desc'),
		);

		const querySnapshot = await getDocs(transactionsQuery);
		const transactions: TransactionType[] = [];

		const yearlyData = [
			{
				year: year.toString(),
				income: 0,
				expense: 0,
			},
		];

		querySnapshot.forEach((doc) => {
			const transaction = doc.data() as TransactionType;
			transaction.id = doc.id;
			transactions.push(transaction);

			if (transaction.type === 'income') yearlyData[0].income += Number(transaction.amount);
			else yearlyData[0].expense += Number(transaction.amount);
		});

		const stats = yearlyData.flatMap((y) => [
			{
				value: y.income,
				label: y.year,
				spacing: 4,
				labelWidth: 46,
				frontColor: colors.primaryLight,
			},
			{ value: y.expense, frontColor: colors.rose },
		]);

		return { success: true, data: { stats, transactions } };
	} catch (error: any) {
		return { success: false, msg: error.message };
	}
};

export const fetchCategories = async (uid: string) => {
	try {
		const categoriesRef = collection(db, 'categories');

		const q = query(categoriesRef, where('uid', '==', uid));
		const querySnapshot = await getDocs(q);

		let categories: any[] = [];
		querySnapshot.forEach((doc) => {
			categories.push({ id: doc.id, ...doc.data() });
		});

		return { success: true, data: categories };
	} catch (error: any) {
		return { success: false, msg: error.message };
	}
};
