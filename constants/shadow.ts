import { colors } from './theme';

const lightShadow = 'rgba(65, 71, 85, 0.5)';
const darkShadow = colors.gradientEnd;

export const SHADOW_BLOCK = {
	light: {
		distance: 6,
		startColor: lightShadow,
		offset: [-1, -1] as [number, number],
		stretch: true,
	},
	dark: {
		distance: 8,
		startColor: darkShadow,
		offset: [3, 3] as [number, number],
		stretch: true,
	},
};

export const SHADOW_AVATAR = {
	light: {
		distance: 15,
		startColor: 'rgba(255, 255, 255, 0.08)',
		offset: [-3, -3] as [number, number],
	},
	dark: {
		distance: 18,
		startColor: 'rgba(5, 7, 10, 0.7)',
		offset: [5, 5] as [number, number],
	},
};

export const SHADOW_OPTIONS = {
	light: {
		distance: 10,
		startColor: 'rgba(60, 75, 100, 0.12)',
		offset: [-3, -3] as [number, number],
		stretch: true,
	},
	dark: {
		distance: 12,
		startColor: 'rgba(0, 0, 0, 0.8)',
		offset: [5, 5] as [number, number],
		stretch: true,
	},
};

export const SHADOW_DROPDOWN = {
	light: {
		distance: 6,
		startColor: lightShadow,
		offset: [-1, -1] as [number, number],
		stretch: true,
	},
	dark: {
		distance: 8,
		startColor: darkShadow,
		offset: [2, 2] as [number, number],
		stretch: true,
	},
};

export const SHADOW_INPUT = {
	light: {
		distance: 3,
		startColor: 'rgba(0, 0, 0, 0.8)',
		offset: [5, 5] as [number, number],
		stretch: true,
	},
	dark: {
		distance: 2,
		startColor: 'rgba(65, 71, 85, 0.4)',
		offset: [-1, -1] as [number, number],
		stretch: true,
	},
};

export const SHADOW_INPUT_AUTH = {
	light: {
		distance: 10,
		startColor: 'rgba(0, 0, 0, 0.8)',
		offset: [3, 3] as [number, number],
		stretch: true,
	},
	dark: {
		distance: 8,
		startColor: 'rgba(65, 71, 85, 0.4)',
		offset: [-3, -3] as [number, number],
		stretch: true,
	},
};

export const SHADOW_BUTTON = {
	light: {
		distance: 6,
		startColor: 'rgba(65, 71, 85, 0.5)',
		offset: [-1, -1] as [number, number],
		stretch: true,
	},
	dark: {
		distance: 8,
		startColor: colors.gradientEnd,
		offset: [2, 2] as [number, number],
		stretch: true,
	},
};
