import { darkColors } from './theme';

export const getGradients = (colors: typeof darkColors) => {
	const start = colors?.gradientStart || '#292e3a';
	const mid = colors?.gradientMid || '#171921';
	const end = colors?.gradientEnd || '#0c0d12';

	return {
		MAIN_GRADIENT: {
			colors: [start, mid, end] as [string, string, string],
			start: { x: 0.5, y: 0 },
			end: { x: 0.5, y: 1 },
			locations: [0, 0.45, 1] as [number, number, number],
		},
		BUTTON_GRADIENT: {
			colors: [start, mid] as [string, string],
			start: { x: 0, y: 0 },
			end: { x: 1, y: 1 },
		},
		BUTTON_GRADIENT_WHITE: {
			colors: ['#FFFFFF', '#EBF0F2', '#C8CFD3'] as [string, string, string],
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
		},
		INPUT_GRADIENT: {
			colors: [mid, end] as [string, string],
			start: { x: 0.5, y: 0 },
			end: { x: 0.5, y: 1 },
		},
	};
};
