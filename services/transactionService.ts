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
	 * Создает транзакцию и атомарно обновляет баланс кошелька (или двух кошельков при переводе)
	 */
	createTransaction: async (data: TransactionData) => {
		const transactionRef = doc(collection(db, 'transactions'));
		const walletRef = doc(db, 'wallets', data.walletId);
		const toWalletRef = data.toWalletId ? doc(db, 'wallets', data.toWalletId) : null;

		// Запускаем атомарную транзакцию Firestore
		await runTransaction(db, async (ts) => {
			// 1. Проверяем баланс основного кошелька
			const walletSnap = await ts.get(walletRef);
			if (!walletSnap.exists()) {
				throw new Error('Основний гаманець не знайдено в системі');
			}
			const currentBalance = walletSnap.data().amount || 0;

			// 2. Если это перевод, проверяем целевой кошелек
			let toWalletCurrentBalance = 0;
			if (toWalletRef) {
				const toWalletSnap = await ts.get(toWalletRef);
				if (!toWalletSnap.exists()) {
					throw new Error('Цільовий гаманець для переказу не знайдено');
				}
				toWalletCurrentBalance = toWalletSnap.data().amount || 0;
			}

			// 3. Высчитываем новые балансы в зависимости от типа операции
			let newBalance = currentBalance;
			let newToWalletBalance = toWalletCurrentBalance;

			if (data.type === 'expense') {
				newBalance = currentBalance - data.amount;
			} else if (data.type === 'income') {
				newBalance = currentBalance + data.amount;
			} else if (data.type === 'transfer') {
				if (currentBalance < data.amount) {
					throw new Error('Недостатньо коштів на гаманці для здійснення переказу');
				}
				newBalance = currentBalance - data.amount;
				newToWalletBalance = toWalletCurrentBalance + data.amount;
			}

			// 4. Записываем саму транзакцию в коллекцию 'transactions'
			ts.set(transactionRef, {
				...data,
				amount: Number(data.amount),
				date: data.date, // Сохраняем переданную дату
				createdAt: serverTimestamp(), // Время создания записи на сервере
			});

			// 5. Обновляем балансы кошельков
			ts.update(walletRef, { amount: newBalance });
			if (toWalletRef) {
				ts.update(toWalletRef, { amount: newToWalletBalance });
			}
		});
	},
};
