import { db } from '@/config/firebase';
import {
	addDoc,
	collection,
	doc,
	getDocs,
	query,
	runTransaction,
	serverTimestamp,
	updateDoc,
	where,
} from 'firebase/firestore';

export const DEFAULT_WALLET_IMAGE = 'default_wallet';

export interface WalletInput {
	name: string;
	image: string | null;
	uid: string;
	isExcludedFromTotal?: boolean;
}

// 1. Создание кошелька
export const createWallet = async (walletData: WalletInput) => {
	await addDoc(collection(db, 'wallets'), {
		name: walletData.name,
		image: walletData.image || DEFAULT_WALLET_IMAGE,
		uid: walletData.uid,
		amount: 0,
		totalIncome: 0,
		totalExpenses: 0,
		created: serverTimestamp(),
		isExcludedFromTotal: walletData.isExcludedFromTotal || false,
	});
};

// 2. Обновление кошелька
export const updateWallet = async (
	walletId: string,
	name: string,
	image: string | null,
	isExcludedFromTotal?: boolean,
) => {
	const walletRef = doc(db, 'wallets', walletId);
	await updateDoc(walletRef, {
		name,
		image: image || DEFAULT_WALLET_IMAGE,
		isExcludedFromTotal: !!isExcludedFromTotal,
	});
};

// 3. Безопасное удаление кошелька с переносом всех его транзакций
export const deleteWalletWithTransfer = async (
	walletId: string,
	userId: string,
	targetWalletId: string | null, // id предыдущего кошелька, куда переносим
) => {
	if (!targetWalletId) {
		throw new Error('Не знайдено іншого гаманця для перенесення транзакцій.');
	}

	// Ищем все транзакции, привязанные к удаляемому кошельку
	const transactionsQuery = query(
		collection(db, 'transactions'),
		where('uid', '==', userId),
		where('walletId', '==', walletId),
	);
	const transactionsSnapshot = await getDocs(transactionsQuery);

	// Атомарная транзакция в Firebase
	await runTransaction(db, async (transaction) => {
		const deletedWalletRef = doc(db, 'wallets', walletId);
		const targetWalletRef = doc(db, 'wallets', targetWalletId);

		const targetWalletSnap = await transaction.get(targetWalletRef);
		const deletedWalletSnap = await transaction.get(deletedWalletRef);

		if (!targetWalletSnap.exists() || !deletedWalletSnap.exists()) {
			throw new Error('Один із гаманців не існує.');
		}

		const deletedData = deletedWalletSnap.data();
		const targetData = targetWalletSnap.data();

		// 1. Пересчитываем балансы целевого кошелька, прибавляя данные удаляемого
		transaction.update(targetWalletRef, {
			amount: (targetData.amount || 0) + (deletedData.amount || 0),
			totalIncome: (targetData.totalIncome || 0) + (deletedData.totalIncome || 0),
			totalExpenses: (targetData.totalExpenses || 0) + (deletedData.totalExpenses || 0),
		});

		// 2. Меняем walletId во всех связанных транзакциях на новый кошелек
		transactionsSnapshot.docs.forEach((transactionDoc) => {
			const docRef = doc(db, 'transactions', transactionDoc.id);
			transaction.update(docRef, { walletId: targetWalletId });
		});

		// 3. Удаляем старый кошелек
		transaction.delete(deletedWalletRef);
	});
};
