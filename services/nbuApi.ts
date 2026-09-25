export interface CurrencyItem {
	r030: number;
	txt: string; // Название (например, "Долар США")
	rate: number; // Официальный курс
	cc: string; // Код (USD, EUR, GBP)
	countryCode: string; // Код страны для CDN флагов (us, eu, gb)
	buyRate: number; // Расчетный курс покупки
	sellRate: number; // Расчетный курс продажи
}

// Топ-15 популярных валют с кодами стран для флагов
const POPULAR_CURRENCIES: Record<string, { countryCode: string; name: string }> = {
	USD: { countryCode: 'us', name: 'Долар США' },
	EUR: { countryCode: 'eu', name: 'Євро' },
	GBP: { countryCode: 'gb', name: 'Фунт стерлінгів' },
	CHF: { countryCode: 'ch', name: 'Швейцарський франк' },
	PLN: { countryCode: 'pl', name: 'Злотий' },
	CAD: { countryCode: 'ca', name: 'Канадський долар' },
	JPY: { countryCode: 'jp', name: 'Японська єна' },
	CZK: { countryCode: 'cz', name: 'Чеська крона' },
	SEK: { countryCode: 'se', name: 'Шведська крона' },
	NOK: { countryCode: 'no', name: 'Норвезька крона' },
	DKK: { countryCode: 'dk', name: 'Данська крона' },
	AUD: { countryCode: 'au', name: 'Австралійський долар' },
	HUF: { countryCode: 'hu', name: 'Угорський форинт' },
	TRY: { countryCode: 'tr', name: 'Турецька ліра' },
	CNY: { countryCode: 'cn', name: 'Китайський юань' },
};

export const getFlagUrl = (countryCode?: string) => {
	if (!countryCode) return 'https://flagcdn.com/w80/un.png';
	return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
};

export const fetchPopularRates = async (): Promise<CurrencyItem[]> => {
	try {
		const response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json');
		const data = await response.json();

		const orderedCurrencyCodes = Object.keys(POPULAR_CURRENCIES);

		const filtered = data
			.filter((item: any) => POPULAR_CURRENCIES[item.cc])
			.map((item: any) => {
				const meta = POPULAR_CURRENCIES[item.cc]!;
				const officialRate = item.rate;

				return {
					r030: item.r030,
					txt: meta.name,
					rate: officialRate,
					cc: item.cc,
					countryCode: meta.countryCode,
					buyRate: Number((officialRate * 0.995).toFixed(2)),
					sellRate: Number((officialRate * 1.005).toFixed(2)),
				};
			});

		return filtered.sort((a: any, b: any) => {
			return orderedCurrencyCodes.indexOf(a.cc) - orderedCurrencyCodes.indexOf(b.cc);
		});
	} catch (error) {
		console.error('NBU API Error:', error);
		return [];
	}
};
