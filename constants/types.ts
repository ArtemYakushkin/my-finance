import { Timestamp } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';

export type TransactionType = {
	id: string;
	type: 'expense' | 'income' | 'transfer';
	amount: number;
	categoryGroup?: string;
	category?: string;
	date: Date | Timestamp | string;
	description?: string;
	image?: any;
	uid?: string;
	walletId?: string;
	fromWalletId?: string;
	toWalletId?: string;
};

export type ResponseType = {
	success: boolean;
	data?: any;
	msg?: string;
};

export const categoryGroups = [
	{ label: 'База', value: 'needs', color: '#4a90e2', icon: Icons.HouseLine },
	{ label: 'Хочу', value: 'desires', color: '#ef4444', icon: Icons.Star },
	{ label: 'Резерв', value: 'saving', color: '#a3e635', icon: Icons.PiggyBank },
];

export interface PlannedTransaction {
	id?: string;
	uid: string;
	type: 'expense' | 'income';
	title: string;
	category?: string; // Категория (для расходов)
	amount: number;
	isRecurring: boolean; // Регулярный или разовый
	frequency?: 'monthly' | 'yearly'; // Периодичность
	dueDate: string; // Формат "YYYY-MM-DD" для удобной фильтрации в календаре
	walletId?: string;
}
