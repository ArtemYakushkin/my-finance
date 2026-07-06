import { auth, db } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserType {
	uid: string;
	email: string | null;
	name?: string;
	currency?: string;
	avatar?: string;
	[key: string]: any;
}

interface AuthContextType {
	user: UserType | null;
	loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<UserType | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let unsubDoc: (() => void) | null = null;

		const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
			// Очищаем старую подписку на документ при смене состояния
			if (unsubDoc) {
				unsubDoc();
				unsubDoc = null;
			}

			if (firebaseUser) {
				// Если Firebase нашел сохраненную сессию, идем в Firestore за именем
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
						setLoading(false); // Загрузка завершена, данные пользователя получены
					},
					(error) => {
						console.error(
							'Помилка Firestore при получении профиля:',
							error,
						);
						setLoading(false);
					},
				);
			} else {
				// Сессии нет, сбрасываем состояние
				setUser(null);
				setLoading(false);
			}
		});

		return () => {
			unsubAuth();
			if (unsubDoc) unsubDoc();
		};
	}, []);

	return (
		<AuthContext.Provider value={{ user, loading }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
