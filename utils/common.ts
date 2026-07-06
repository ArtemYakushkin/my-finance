export const getCurrencySymbol = (currency: string = 'UAH') => {
	switch (currency) {
		case 'USD':
			return '$';
		case 'EUR':
			return '€';
		case 'UAH':
			return '₴';
		default:
			return '₴';
	}
};
