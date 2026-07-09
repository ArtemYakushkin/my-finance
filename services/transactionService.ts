import { db } from '@/config/firebase';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';

// Строгая типизация структуры транзакции в базе данных
export type TransactionData = {
	uid: string;
	type: 'expense' | 'income' | 'transfer';
	amount: number;
	walletId: string;
	toWalletId?: string; // Только для типа transfer
	categoryGroup?: string; // Только для типа expense
	category?: string; // Только для типа expense (подкатегория)
	date: Date;
	description?: string;
};

export const transactionService = {
	/**
	 * Создает транзакцию и атомарно обновляет баланс кошелька,
	 * а также его общий доход (totalIncome) и расход (totalExpenses).
	 */
	createTransaction: async (data: TransactionData) => {
		const transactionRef = doc(collection(db, 'transactions'));
		const walletRef = doc(db, 'wallets', data.walletId);
		const toWalletRef = data.toWalletId ? doc(db, 'wallets', data.toWalletId) : null;

		// Запускаем атомарную транзакцию Firestore
		await runTransaction(db, async (ts) => {
			// 1. Получаем данные основного кошелька (отправитель / получатель)
			const walletSnap = await ts.get(walletRef);
			if (!walletSnap.exists()) {
				throw new Error('Основний гаманець не знайдено в системі');
			}
			const currentBalance = walletSnap.data().amount || 0;
			const currentTotalIncome = walletSnap.data().totalIncome || 0;
			const currentTotalExpenses = walletSnap.data().totalExpenses || 0;

			// 2. Если это перевод, получаем данные целевого кошелька
			let toWalletCurrentBalance = 0;
			let toWalletCurrentIncome = 0;
			if (toWalletRef) {
				const toWalletSnap = await ts.get(toWalletRef);
				if (!toWalletSnap.exists()) {
					throw new Error('Цільовий гаманець для переказу не знайдено');
				}
				toWalletCurrentBalance = toWalletSnap.data().amount || 0;
				toWalletCurrentIncome = toWalletSnap.data().totalIncome || 0;
			}

			// Инициализируем переменные для новых значений
			let newBalance = currentBalance;
			let newTotalIncome = currentTotalIncome;
			let newTotalExpenses = currentTotalExpenses;

			let newToWalletBalance = toWalletCurrentBalance;
			let newToWalletIncome = toWalletCurrentIncome;

			// 3. Высчитываем новые балансы и аналитику (доходы/расходы)
			if (data.type === 'expense') {
				if (currentBalance < data.amount) {
					throw new Error('Недостатньо коштів на гаманці для здійснення витрати');
				}
				newBalance = currentBalance - data.amount;
				newTotalExpenses = currentTotalExpenses + data.amount; // Увеличиваем расход кошелька
			} else if (data.type === 'income') {
				newBalance = currentBalance + data.amount;
				newTotalIncome = currentTotalIncome + data.amount; // Увеличиваем доход кошелька
			} else if (data.type === 'transfer') {
				if (currentBalance < data.amount) {
					throw new Error('Недостатньо коштів на гаманці для здійснення переказу');
				}
				// Для ПЕРЕВОДА:
				// Основной кошелек теряет баланс, но его внутренний расход растет
				newBalance = currentBalance - data.amount;
				newTotalExpenses = currentTotalExpenses + data.amount;

				// Целевой кошелек получает баланс, его внутренний доход растет
				newToWalletBalance = toWalletCurrentBalance + data.amount;
				newToWalletIncome = toWalletCurrentIncome + data.amount;
			}

			// 4. Записываем саму транзакцию в коллекцию 'transactions'
			ts.set(transactionRef, {
				...data,
				amount: Number(data.amount),
				date: data.date,
				createdAt: serverTimestamp(),
			});

			// 5. Атомарно обновляем кошельки
			ts.update(walletRef, {
				amount: newBalance,
				totalIncome: newTotalIncome,
				totalExpenses: newTotalExpenses,
			});

			if (toWalletRef) {
				ts.update(toWalletRef, {
					amount: newToWalletBalance,
					totalIncome: newToWalletIncome,
					// totalExpenses для целевого кошелька при переводе не меняется
				});
			}
		});
	},
};
