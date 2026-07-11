import { globalStyles } from '@/constants/global';
import { MAIN_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react'; // Добавили useEffect
import { Dimensions, View } from 'react-native';
import Modal from 'react-native-modal';
import BackBtnModal from './BackBtnModal';
import CalcButton from './CalcButton';
import CalcButtonOperators from './CalcButtonOperators';
import Header from './Header';
import Typo from './Typo';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CalculatorProps {
	isVisible: boolean;
	onClose: () => void; // Убрали отсюда передачу строки, закрытие должно быть чистым
	initialValue: string;
	onSelectAmount: (value: number) => void;
}

const CalculatorModal = ({ isVisible, onClose, initialValue, onSelectAmount }: CalculatorProps) => {
	// Если прилетает '0', лучше показать пустую строку, чтобы пользователь сразу вводил цифры
	const [expression, setExpression] = useState('0');

	// СИНХРОНИЗАЦИЯ: Каждый раз, когда модалка открывается, подтягиваем актуальное значение из формы
	useEffect(() => {
		if (isVisible) {
			setExpression(initialValue && initialValue !== '0' ? initialValue : '0');
		}
	}, [isVisible, initialValue]);

	// Вспомогательная функция для безопасного вычисления выражения
	const evaluateExpression = (expr: string): number => {
		try {
			const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
			// Если строка пустая или дефолтная
			if (!sanitized || sanitized === '0') return 0;

			const result = eval(sanitized);
			if (isNaN(result) || !isFinite(result)) return 0;

			return Number(Number.isInteger(result) ? result : result.toFixed(2));
		} catch {
			return 0;
		}
	};

	const handlePress = (val: string) => {
		if (val === 'C') {
			setExpression('0');
		} else if (val === '=') {
			const result = evaluateExpression(expression);
			setExpression(String(result));
		} else if (val === 'back') {
			setExpression((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
		} else {
			setExpression((prev) => (prev === '0' && val !== '.' ? val : prev + val));
		}
	};

	// ФУНКЦИЯ ПОДТВЕРЖДЕНИЯ: Считает результат, отдает число родителю и закрывает модалку
	const handleConfirm = () => {
		const finalAmount = evaluateExpression(expression);
		onSelectAmount(finalAmount); // Отправляем число (например: 150) в ExpenseForm
	};

	return (
		<Modal
			isVisible={isVisible}
			onBackdropPress={handleConfirm} // При тапе мимо — сохраняем то, что насчитали
			onSwipeComplete={handleConfirm} // При свайпе вниз — тоже сохраняем
			swipeDirection="down"
			propagateSwipe={true}
			style={globalStyles.calcModal}
			backdropOpacity={0.8}
			deviceHeight={SCREEN_HEIGHT}
			animationIn="slideInUp"
			animationOut="slideOutDown"
		>
			<LinearGradient
				{...(MAIN_GRADIENT as any)}
				style={[globalStyles.calcContainer, { height: SCREEN_HEIGHT * 0.95 }]}
			>
				<View style={globalStyles.calcHandle} />

				<Header title={'Розрахунок'} leftIcon={<BackBtnModal onPress={onClose} />} />

				<View style={globalStyles.calcDisplayWrapper}>
					<View style={globalStyles.calcDisplayInner}>
						<Typo size={50} fontWeight="600" color={colors.white}>
							{expression}
						</Typo>
					</View>
				</View>

				<View style={{ marginTop: 'auto' }}>
					<View style={globalStyles.calcButtonOperators}>
						<CalcButtonOperators text="+" onPress={() => handlePress('+')} />
						<CalcButtonOperators text="-" onPress={() => handlePress('-')} />
						<CalcButtonOperators text="×" onPress={() => handlePress('×')} />
						<CalcButtonOperators text="÷" onPress={() => handlePress('÷')} />
					</View>

					<View style={globalStyles.calcGrid}>
						<CalcButton text="1" onPress={() => handlePress('1')} />
						<CalcButton text="2" onPress={() => handlePress('2')} />
						<CalcButton text="3" onPress={() => handlePress('3')} />

						<CalcButton text="4" onPress={() => handlePress('4')} />
						<CalcButton text="5" onPress={() => handlePress('5')} />
						<CalcButton text="6" onPress={() => handlePress('6')} />

						<CalcButton text="7" onPress={() => handlePress('7')} />
						<CalcButton text="8" onPress={() => handlePress('8')} />
						<CalcButton text="9" onPress={() => handlePress('9')} />

						<CalcButton text="C" onPress={() => handlePress('C')} />
						<CalcButton text="0" onPress={() => handlePress('0')} />
						<CalcButton text="back" onPress={() => handlePress('back')} />

						<CalcButton text="=" onPress={() => handlePress('=')} isEqual isDouble />
						<CalcButton text="Done" onPress={handleConfirm} isDone isDouble />
					</View>
				</View>
			</LinearGradient>
		</Modal>
	);
};

export default CalculatorModal;
