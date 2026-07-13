import { db } from '@/config/firebase';
import { collection, doc, getDocs, increment, query, where, writeBatch } from 'firebase/firestore';

export const updateCategoriesOrder = async (updatedCategories: { id: string; order: number }[]) => {
	try {
		const batch = writeBatch(db);
		updatedCategories.forEach((cat) => {
			const catRef = doc(db, 'categories', cat.id);
			batch.update(catRef, { order: cat.order });
		});
		await batch.commit();
		return { success: true };
	} catch (error: any) {
		console.error('Помилка оновлення порядку:', error);
		return { success: false };
	}
};

export const deleteCategoryAndRefundBalance = async (uid: string, categoryName: string) => {
	try {
		const batch = writeBatch(db);
		const categoryQuery = query(
			collection(db, 'categories'),
			where('uid', '==', uid),
			where('name', '==', categoryName),
		);
		const categorySnapshot = await getDocs(categoryQuery);

		if (categorySnapshot.empty) {
			return { success: false, msg: 'Категорію не знайдено' };
		}

		const categoryDoc = categorySnapshot.docs[0];
		const categoryId = categoryDoc.id;

		batch.delete(categoryDoc.ref);

		const transactionsQuery = query(
			collection(db, 'transactions'),
			where('uid', '==', uid),
			where('category', '==', categoryId),
		);
		const transactionsSnapshot = await getDocs(transactionsQuery);
		const walletRefunds: { [walletId: string]: number } = {};

		transactionsSnapshot.forEach((transDoc) => {
			const transData = transDoc.data();
			const amount = transData.amount || 0;
			const walletId = transData.walletId;
			const transType = transData.type;
			if (walletId) {
				const refundAmount = transType === 'expense' ? amount : -amount;

				if (walletRefunds[walletId]) {
					walletRefunds[walletId] += refundAmount;
				} else {
					walletRefunds[walletId] = refundAmount;
				}
			}
			batch.delete(transDoc.ref);
		});

		Object.keys(walletRefunds).forEach((walletId) => {
			const walletRef = doc(db, 'wallets', walletId);
			const refundAmount = walletRefunds[walletId];
			if (refundAmount > 0) {
				batch.update(walletRef, {
					amount: increment(refundAmount),
					totalExpenses: increment(-refundAmount),
				});
			} else {
				batch.update(walletRef, {
					amount: increment(refundAmount),
					totalIncome: increment(refundAmount),
				});
			}
		});

		await batch.commit();

		return { success: true };
	} catch (error) {
		console.error('Помилка при видаленні категорії та перерахунку:', error);
		return { success: false, msg: error instanceof Error ? error.message : 'Невідома помилка' };
	}
};
