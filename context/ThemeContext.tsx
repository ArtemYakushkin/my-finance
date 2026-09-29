// context/ThemeContext.tsx
import { darkColors, lightColors, ThemeMode } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
	theme: ThemeMode;
	colors: typeof darkColors;
	isDark: boolean;
	toggleTheme: () => void;
}

const THEME_KEY = '@app_theme';

const ThemeContext = createContext<ThemeContextType>({
	theme: 'dark',
	colors: darkColors,
	isDark: true,
	toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const [theme, setTheme] = useState<ThemeMode>('dark');

	useEffect(() => {
		AsyncStorage.getItem(THEME_KEY).then((saved) => {
			if (saved === 'light' || saved === 'dark') {
				setTheme(saved);
			}
		});
	}, []);

	const toggleTheme = () => {
		const next = theme === 'dark' ? 'light' : 'dark';
		setTheme(next);
		AsyncStorage.setItem(THEME_KEY, next);
	};

	const colors = theme === 'light' ? lightColors : darkColors;

	return (
		<ThemeContext.Provider value={{ theme, colors, isDark: theme === 'dark', toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);
