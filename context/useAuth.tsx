import { auth, db } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'; // Добавили updateDoc
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserType {
	uid: string;
	email: string | null;
	name?: string;
	currency?: string;
	image?: string | null; // Синхронизировали с базой
	[key: string]: any;
}

interface AuthContextType {
	user: UserType | null;
	loading: boolean;
	updateUser: (uid: string, data: Partial<UserType>) => Promise<{ success: boolean; msg?: string }>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
	updateUser: async () => ({ success: false, msg: 'Context not initialized' }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<UserType | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let unsubDoc: (() => void) | null = null;

		const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
			if (unsubDoc) {
				unsubDoc();
				unsubDoc = null;
			}

			if (firebaseUser) {
				const userDocRef = doc(db, 'users', firebaseUser.uid);

				unsubDoc = onSnapshot(
					userDocRef,
					(docSnap) => {
						if (docSnap.exists()) {
							setUser({
								uid: firebaseUser.uid,
								email: firebaseUser.email,
								...docSnap.data(),
							});
						} else {
							setUser({
								uid: firebaseUser.uid,
								email: firebaseUser.email,
							});
						}
						setLoading(false);
					},
					(error) => {
						console.error('Помилка Firestore при получении профиля:', error);
						setLoading(false);
					},
				);
			} else {
				setUser(null);
				setLoading(false);
			}
		});

		return () => {
			unsubAuth();
			if (unsubDoc) unsubDoc();
		};
	}, []);

	// Вынесли из useEffect, чтобы функция была доступна в контексте
	const updateUser = async (uid: string, data: Partial<UserType>) => {
		try {
			if (!uid) return { success: false, msg: 'User ID is required' };

			const docRef = doc(db, 'users', uid); // Используем db вместо firestore

			await updateDoc(docRef, data as any);

			// Локальный стейт обновится сам благодаря подписке onSnapshot!
			return { success: true };
		} catch (error: any) {
			console.log('Error updating user:', error);
			return { success: false, msg: error.message };
		}
	};

	return <AuthContext.Provider value={{ user, loading, updateUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
