import { colors } from '@/constants/theme';
import { MessageOptions, showMessage } from 'react-native-flash-message';

export const showSuccessToast = (description: string, message = 'Успіх', options?: MessageOptions) => {
	showMessage({
		message,
		description,
		type: 'success',
		backgroundColor: colors.gradientMid,
		color: colors.primary,
		...options,
	});
};

export const showErrorToast = (description: string, message = 'Помилка', options?: MessageOptions) => {
	showMessage({
		message,
		description,
		type: 'danger',
		backgroundColor: colors.gradientMid,
		color: colors.rose,
		...options,
	});
};

export const showWarningToast = (description: string, message = 'Увага', options?: MessageOptions) => {
	showMessage({
		message,
		description,
		type: 'warning',
		backgroundColor: colors.gradientMid,
		color: colors.orange,
		...options,
	});
};

export const showInfoToast = (description: string, message = 'Інформація', options?: MessageOptions) => {
	showMessage({
		message,
		description,
		type: 'info',
		backgroundColor: colors.gradientMid,
		color: colors.primaryLight,
		...options,
	});
};
