import { colors } from './theme';

const gradientColors: [string, string, ...string[]] = [colors.gradientStart, colors.gradientMid];
const concavedGradientColors: [string, string] = [colors.gradientMid as string, colors.gradientEnd as string];

export const MAIN_GRADIENT = {
	colors: [colors.gradientStart, colors.gradientMid, colors.gradientEnd],
	start: { x: 0.5, y: 0 },
	end: { x: 0.5, y: 1 },
	locations: [0, 0.45, 1] as number[],
};

export const BUTTON_GRADIENT = {
	colors: gradientColors,
	start: { x: 0, y: 0 },
	end: { x: 1, y: 1 },
};

export const INPUT_GRADIENT = {
	colors: concavedGradientColors,
	start: { x: 0.5, y: 0 },
	end: { x: 0.5, y: 1 },
};
