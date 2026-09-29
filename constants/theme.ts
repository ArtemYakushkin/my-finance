export const darkColors = {
	primary: '#a3e635',
	primaryLight: '#4a90e2',
	primaryDark: '#0369a1',
	rose: '#ef4444',
	green: '#16a34a',
	orange: '#ffae00',
	neutral100: '#f5f5f5',
	neutral200: '#e5e5e5',
	neutral300: '#d4d4d4',
	neutral350: '#CCCCCC',
	neutral400: '#a3a3a3',
	neutral500: '#737373',
	neutral600: '#525252',
	neutral700: '#404040',
	neutral800: '#262626',
	neutral900: '#171717',
	gradientStart: '#292e3a',
	gradientMid: '#171921',
	gradientEnd: '#0c0d12',
};

export const lightColors: typeof darkColors = {
	primary: '#65a30d',
	primaryLight: '#2563eb',
	primaryDark: '#0284c7',
	rose: '#dc2626',
	green: '#16a34a',
	orange: '#d97706',
	neutral100: '#171717',
	neutral200: '#262626',
	neutral300: '#404040',
	neutral350: '#525252',
	neutral400: '#737373',
	neutral500: '#656565ff',
	neutral600: '#d4d4d4',
	neutral700: '#e5e5e5',
	neutral800: '#f5f5f5',
	neutral900: '#ffffff',
	gradientStart: '#FFFFFF',
	gradientMid: '#EBF0F2',
	gradientEnd: '#C8CFD3',
};

// Для обратной совместимости по умолчанию берем темную
export const colors = darkColors;
export type ThemeMode = 'dark' | 'light';
