import { db } from '@/config/firebase';
import { collection, doc, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';

// Строгая типизация структуры транзакции в базе данных
export type TransactionData = {
	uid: string;
	type: 'expense' | 'income' | 'transfer';
	amount: number;
	walletId: string; // Для transfer это кошелек-отправитель (fromWalletId)
	toWalletId?: string; // Только для типа transfer
	categoryGroup?: string; // Только для типа expense
	category?: string; // Только для типа expense (подкатегория)
	date: Date;
	description?: string;
};

export const transactionService = {
	/**
	 * Создает транзакцию и атомарно обновляет балансы и аналитику кошельков.
	 */
	createTransaction: async (data: TransactionData) => {
		const transactionRef = doc(collection(db, 'transactions'));
		const walletRef = doc(db, 'wallets', data.walletId);
		const toWalletRef = data.toWalletId ? doc(db, 'wallets', data.toWalletId) : null;

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

			let newToWalletBalance = 0;
			let newToWalletIncome = 0;

			if (data.type === 'expense') {
				if (currentBalance < data.amount) {
					throw new Error('Недостатньо коштів на гаманці для здійснення витрати');
				}
				newBalance = currentBalance - data.amount;
				newTotalExpenses = currentTotalExpenses + data.amount;
			} else if (data.type === 'income') {
				newBalance = currentBalance + data.amount;
				newTotalIncome = currentTotalIncome + data.amount;
			} else if (data.type === 'transfer') {
				if (!toWalletRef) throw new Error('Не вказано цільовий гаманець для переказу');

				const toWalletSnap = await ts.get(toWalletRef);
				if (!toWalletSnap.exists()) {
					throw new Error('Цільовий гаманець для переказу не знайдено');
				}
				if (currentBalance < data.amount) {
					throw new Error('Недостатньо коштів на гаманці для здійснення переказу');
				}

				// Объявляем константы прямо здесь, внутри блока
				const toWalletCurrentBalance = Number(toWalletSnap.data().amount || 0);
				const toWalletCurrentIncome = Number(toWalletSnap.data().totalIncome || 0);

				newBalance = currentBalance - data.amount;
				newTotalExpenses = currentTotalExpenses + data.amount;

				newToWalletBalance = toWalletCurrentBalance + data.amount;
				newToWalletIncome = toWalletCurrentIncome + data.amount;
			}

			// Запись транзакции
			ts.set(transactionRef, {
				...data,
				amount: Number(data.amount),
				date: Timestamp.fromDate(data.date),
				createdAt: serverTimestamp(),
			});

			// Обновление кошелька-отправителя / основного
			ts.update(walletRef, {
				amount: newBalance,
				totalIncome: newTotalIncome,
				totalExpenses: newTotalExpenses,
			});

			// Обновление кошелька-получателя (если перевод)
			if (toWalletRef) {
				ts.update(toWalletRef, {
					amount: newToWalletBalance,
					totalIncome: newToWalletIncome,
				});
			}
		});
	},

	updateTransaction: async (txId: string, newData: any, oldData: any) => {
		const txRef = doc(db, 'transactions', txId);

		await runTransaction(db, async (ts) => {
			// === ШАГ 1: СТРОГО ВСЕ ЧТЕНИЯ (READS) НА САМОМ ВЕРХУ ТРАНЗАКЦИИ ===
			const oldWalletRef = doc(db, 'wallets', oldData.walletId);
			const newWalletRef = doc(db, 'wallets', newData.walletId);

			// Читаем старый и новый кошелек сразу
			const oldWalletSnap = await ts.get(oldWalletRef);
			const newWalletSnap = await ts.get(newWalletRef);

			// Читаем старый целевой кошелек перевода, если это был перевод
			let oldToWalletSnap = null;
			if (oldData.type === 'transfer') {
				const oldToWalletRef = doc(db, 'wallets', oldData.toWalletId);
				oldToWalletSnap = await ts.get(oldToWalletRef);
			}

			// Читаем новый целевой кошелек перевода, если это новый перевод
			let newToWalletSnap = null;
			if (newData.type === 'transfer') {
				const newToWalletRef = doc(db, 'wallets', newData.toWalletId);
				newToWalletSnap = await ts.get(newToWalletRef);
			}

			// === ШАГ 2: ОТКАТ СТАРЫХ ДАННЫХ (ТОЛЬКО В ПАМЯТИ ИЛИ ПРОВЕРЕННЫЕ ОБНОВЛЕНИЯ) ===
			let oldWBalance = oldWalletSnap.exists() ? Number(oldWalletSnap.data().amount || 0) : 0;
			let oldWIncome = oldWalletSnap.exists() ? Number(oldWalletSnap.data().totalIncome || 0) : 0;
			let oldWExpenses = oldWalletSnap.exists() ? Number(oldWalletSnap.data().totalExpenses || 0) : 0;

			if (oldWalletSnap.exists()) {
				if (oldData.type === 'expense') {
					oldWBalance += Number(oldData.amount);
					oldWExpenses -= Number(oldData.amount);
				} else if (oldData.type === 'income') {
					oldWBalance -= Number(oldData.amount);
					oldWIncome -= Number(oldData.amount);
				} else if (oldData.type === 'transfer') {
					oldWBalance += Number(oldData.amount);
					oldWExpenses -= Number(oldData.amount);

					if (oldToWalletSnap && oldToWalletSnap.exists()) {
						ts.update(doc(db, 'wallets', oldData.toWalletId), {
							amount: Number(oldToWalletSnap.data().amount || 0) - Number(oldData.amount),
							totalIncome: Number(oldToWalletSnap.data().totalIncome || 0) - Number(oldData.amount),
						});
					}
				}
			}

			// === ШАГ 3: НАВЕШИВАНИЕ НОВЫХ ДАННЫХ И ПРОВЕРКА БАЛАНСА ===
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
			} else if (newData.type === 'income') {
				newWBalance += Number(newData.amount);
				newWIncome += Number(newData.amount);
			} else if (newData.type === 'transfer') {
				if (newWBalance < Number(newData.amount)) throw new Error('Недостатньо коштів для переказу');
				newWBalance -= Number(newData.amount);
				newWExpenses += Number(newData.amount);

				if (!newToWalletSnap || !newToWalletSnap.exists()) throw new Error('Цільовий гаманець не знайдено');

				ts.update(doc(db, 'wallets', newData.toWalletId), {
					amount: Number(newToWalletSnap.data().amount || 0) + Number(newData.amount),
					totalIncome: Number(newToWalletSnap.data().totalIncome || 0) + Number(newData.amount),
				});
			}

			// === ШАГ 4: СТРОГО ВСЕ ЗАПИСИ (WRITES) В САМОМ КОНЦЕ ===
			// Если кошелек сменился, обновляем оба кошелька
			if (oldData.walletId !== newData.walletId) {
				if (oldWalletSnap.exists()) {
					ts.update(oldWalletRef, {
						amount: oldWBalance,
						totalIncome: oldWIncome,
						totalExpenses: oldWExpenses,
					});
				}
				if (newWalletSnap.exists()) {
					ts.update(newWalletRef, {
						amount: newWBalance,
						totalIncome: newWIncome,
						totalExpenses: newWExpenses,
					});
				}
			} else {
				// Если кошелек остался прежним
				if (newWalletSnap.exists()) {
					ts.update(newWalletRef, {
						amount: newWBalance,
						totalIncome: newWIncome,
						totalExpenses: newWExpenses,
					});
				}
			}

			// Обновляем сам документ транзакции
			const updatePayload: any = {
				type: newData.type,
				amount: Number(newData.amount),
				walletId: newData.walletId,
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
				updatePayload.toWalletId = newData.toWalletId;
				updatePayload.categoryGroup = null;
				updatePayload.category = null;
			}

			ts.update(txRef, updatePayload);
		});
	},

	/**
	 * Атомарное удаление транзакции с полным вычетом из общей аналитики кошельков
	 */
	deleteTransaction: async (txId: string, oldData: any) => {
		const txRef = doc(db, 'transactions', txId);
		const walletRef = doc(db, 'wallets', oldData.walletId);

		await runTransaction(db, async (ts) => {
			const walletSnap = await ts.get(walletRef);
			if (!walletSnap.exists()) throw new Error('Гаманець не знайдено');

			let balance = Number(walletSnap.data().amount || 0);
			let totalIncome = Number(walletSnap.data().totalIncome || 0);
			let totalExpenses = Number(walletSnap.data().totalExpenses || 0);
			const amount = Number(oldData.amount || 0);

			if (oldData.type === 'expense') {
				// При удалении расхода: баланс возвращается, аналитика расходов уменьшается
				balance += amount;
				totalExpenses -= amount;
			} else if (oldData.type === 'income') {
				// При удалении дохода: баланс уменьшается, аналитика доходов уменьшается
				balance -= amount;
				totalIncome -= amount;
			} else if (oldData.type === 'transfer') {
				// При удалении перевода: отправителю возвращаем баланс, уменьшаем его расходы
				balance += amount;
				totalExpenses -= amount;

				// Получателю уменьшаем баланс и доходы
				const toWalletRef = doc(db, 'wallets', oldData.toWalletId);
				const toWalletSnap = await ts.get(toWalletRef);
				if (toWalletSnap.exists()) {
					ts.update(toWalletRef, {
						amount: Number(toWalletSnap.data().amount || 0) - amount,
						totalIncome: Number(toWalletSnap.data().totalIncome || 0) - amount,
					});
				}
			}

			// Обновляем статистику кошелька
			ts.update(walletRef, {
				amount: balance,
				totalIncome: totalIncome,
				totalExpenses: totalExpenses,
			});

			// Удаляем сам документ транзакции
			ts.delete(txRef);
		});
	},
};
