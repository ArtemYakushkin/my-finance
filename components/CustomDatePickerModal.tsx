import { globalStyles } from '@/constants/global';
import { INPUT_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { CaretLeftIcon, CaretRightIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, TouchableOpacity, View } from 'react-native';
import Typo from './Typo';

interface CustomDatePickerModalProps {
	isVisible: boolean;
	initialDate: Date;
	onClose: () => void;
	onSelectDate: (date: Date) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const MONTH_NAMES = [
	'Січень',
	'Лютий',
	'Березень',
	'Квітень',
	'Травень',
	'Червень',
	'Липень',
	'Серпень',
	'Вересень',
	'Жовтень',
	'Листопад',
	'Грудень',
];

const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({
	isVisible,
	initialDate,
	onClose,
	onSelectDate,
}) => {
	const [currentMonth, setCurrentMonth] = useState(new Date(initialDate));
	const [selectedDate, setSelectedDate] = useState<Date>(initialDate);

	const year = currentMonth.getFullYear();
	const month = currentMonth.getMonth();

	// Генерация дней для сетки календаря
	const getDaysInMonth = () => {
		const firstDayOfMonth = new Date(year, month, 1);
		const lastDayOfMonth = new Date(year, month + 1, 0);

		// Корректировка первого дня недели (0 - Воскресенье -> 6 - Воскресенье в СНГ)
		let startingDay = firstDayOfMonth.getDay() - 1;
		if (startingDay === -1) startingDay = 6;

		const days = [];

		// Пустые ячейки в начале месяца
		for (let i = 0; i < startingDay; i++) {
			days.push(null);
		}

		// Дни месяца
		for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
			days.push(new Date(year, month, day));
		}

		return days;
	};

	const changeMonth = (delta: number) => {
		setCurrentMonth(new Date(year, month + delta, 1));
	};

	const isSameDay = (d1: Date, d2: Date) => {
		return (
			d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
		);
	};

	const handleConfirm = () => {
		onSelectDate(selectedDate);
	};

	return (
		<Modal visible={isVisible} animationType="fade" transparent>
			<View style={globalStyles.calendarOverlay}>
				<LinearGradient {...INPUT_GRADIENT} style={globalStyles.confModalBox}>
					<View style={globalStyles.calendarHeader}>
						<TouchableOpacity onPress={() => changeMonth(-1)}>
							<CaretLeftIcon size={26} color={colors.primaryLight} weight="bold" />
						</TouchableOpacity>
						<Typo size={16} fontWeight="700" color={colors.white}>
							{MONTH_NAMES[month]} {year}
						</Typo>
						<TouchableOpacity onPress={() => changeMonth(1)}>
							<CaretRightIcon size={26} color={colors.primaryLight} weight="bold" />
						</TouchableOpacity>
					</View>

					<View style={globalStyles.calendarWeekDays}>
						{WEEKDAYS.map((day) => (
							<View key={day} style={globalStyles.calendarDayCell}>
								<Typo size={12} color={colors.neutral400} fontWeight="600">
									{day}
								</Typo>
							</View>
						))}
					</View>

					<View style={globalStyles.calendarDaysGrid}>
						{getDaysInMonth().map((item, index) => {
							if (!item) {
								return <View key={`empty-${index}`} style={globalStyles.calendarDayCell} />;
							}

							const isSelected = isSameDay(item, selectedDate);
							const isToday = isSameDay(item, new Date());

							return (
								<TouchableOpacity
									key={item.toISOString()}
									style={[
										globalStyles.calendarDayCell,
										isSelected && globalStyles.calendarSelectedCell,
										!isSelected && isToday && globalStyles.calendarTodayCell,
									]}
									onPress={() => setSelectedDate(item)}
								>
									<Typo
										size={14}
										fontWeight={isSelected || isToday ? '700' : '400'}
										color={isSelected ? colors.black : colors.white}
									>
										{item.getDate()}
									</Typo>
								</TouchableOpacity>
							);
						})}
					</View>

					<View
						style={{
							marginTop: 20,
							marginBottom: 12,
							marginRight: 12,
							flexDirection: 'row',
							justifyContent: 'flex-end',
							gap: 40,
						}}
					>
						<TouchableOpacity onPress={onClose}>
							<Typo size={16} fontWeight="700" color={colors.rose}>
								Скасувати
							</Typo>
						</TouchableOpacity>

						<TouchableOpacity onPress={handleConfirm}>
							<Typo size={16} fontWeight="700" color={colors.primaryLight}>
								Ok
							</Typo>
						</TouchableOpacity>
					</View>
				</LinearGradient>
			</View>
		</Modal>
	);
};

export default CustomDatePickerModal;
