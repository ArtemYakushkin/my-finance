import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Инициализируем приложение
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Нативная инициализация Auth с постоянным хранилищем для Android/iOS
const auth = (() => {
	if (getApps().length > 0 && (app as any).auth) {
		return (app as any).auth;
	}
	return initializeAuth(app, {
		persistence: getReactNativePersistence(AsyncStorage),
	});
})();

(app as any).auth = auth;
const db = getFirestore(app);

export { app, auth, db };
