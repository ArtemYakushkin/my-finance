import { db } from '@/config/firebase';
import { colors } from '@/constants/theme';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { showMessage } from 'react-native-flash-message';

export const cleanupExpiredTransactions = async (userId: string) => {
	try {
		const now = new Date();
		const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const y = firstDayOfCurrentMonth.getFullYear();
		const m = String(firstDayOfCurrentMonth.getMonth() + 1).padStart(2, '0');
		const d = String(firstDayOfCurrentMonth.getDate()).padStart(2, '0');
		const currentMonthStartStr = `${y}-${m}-${d}`;

		// Делаем простой запрос только по uid (индекс не нужен)
		const q = query(collection(db, 'planned_transactions'), where('uid', '==', userId));

		const snapshot = await getDocs(q);

		if (!snapshot.empty) {
			const batch = writeBatch(db);
			let deletedCount = 0;

			snapshot.docs.forEach((docSnap) => {
				const data = docSnap.data();
				// Фильтруем устаревшие транзакции вручную
				if (data.dueDate && data.dueDate < currentMonthStartStr) {
					batch.delete(docSnap.ref);
					deletedCount++;
				}
			});

			if (deletedCount > 0) {
				await batch.commit();
				showMessage({
					message: 'Успіх',
					description: `Видалено застарілих транзакцій: ${deletedCount}`,
					type: 'success',
					backgroundColor: colors.gradientMid,
					color: colors.primary,
				});
			}
		}
	} catch (error) {
		showMessage({
			message: 'Помилка',
			description: `Помилка автоматичного видалення: ${error}`,
			type: 'danger',
			backgroundColor: colors.gradientMid,
			color: colors.rose,
		});
	}
};
