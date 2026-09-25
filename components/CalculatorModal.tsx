import { globalStyles } from '@/constants/global';
import { MAIN_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react'; // Добавили useEffect
import { Modal, View } from 'react-native';
import CalcButton from './CalcButton';
import Typo from './Typo';

interface CalculatorProps {
	isVisible: boolean;
	onClose: () => void;
	initialValue: string;
	onSelectAmount: (value: number) => void;
}

const CalculatorModal = ({ isVisible, onClose, initialValue, onSelectAmount }: CalculatorProps) => {
	const [expression, setExpression] = useState('0');

	useEffect(() => {
		if (isVisible) {
			setExpression(initialValue && initialValue !== '0' ? initialValue : '0');
		}
	}, [isVisible, initialValue]);

	const evaluateExpression = (expr: string): number => {
		try {
			const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');

			if (!sanitized || sanitized === '0') return 0;

			const result = eval(sanitized);
			if (isNaN(result) || !isFinite(result)) return 0;

			return Number(Number.isInteger(result) ? result : result.toFixed(2));
		} catch {
			return 0;
		}
	};

	const isOp = (char: string) => ['+', '-', '×', '÷'].includes(char);

	const handlePress = (val: string) => {
		if (val === 'C') {
			setExpression('0');
			return;
		}

		if (val === 'back') {
			setExpression((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
			return;
		}

		if (val === '=') {
			const result = evaluateExpression(expression);
			setExpression(String(result));
			return;
		}

		if (isOp(val)) {
			setExpression((prev) => {
				const lastChar = prev.slice(-1);

				if (isOp(lastChar)) {
					return prev.slice(0, -1) + val;
				}

				const hasExistingOperator = /[+×÷-]/.test(prev.slice(1));
				if (hasExistingOperator) {
					const evaluated = evaluateExpression(prev);
					return String(evaluated) + val;
				}

				return prev + val;
			});
			return;
		}

		setExpression((prev) => {
			if (prev === '0' && val !== '.') {
				return val;
			}
			return prev + val;
		});
	};

	const handleConfirm = () => {
		const finalAmount = evaluateExpression(expression);
		onSelectAmount(finalAmount);
	};

	return (
		<Modal visible={isVisible} animationType="fade" transparent>
			<View style={globalStyles.calendarOverlay}>
				<LinearGradient
					{...(MAIN_GRADIENT as any)}
					style={[globalStyles.confModalBox, { padding: 8, paddingBottom: 12 }]}
				>
					<View style={globalStyles.calcDisplayWrapper}>
						<View style={globalStyles.calcDisplayInner}>
							<Typo size={50} fontWeight="600" color={colors.neutral100}>
								{expression}
							</Typo>
						</View>
					</View>

					<View style={{ marginTop: 'auto' }}>
						<View style={globalStyles.calcGrid}>
							<CalcButton text="1" onPress={() => handlePress('1')} />
							<CalcButton text="2" onPress={() => handlePress('2')} />
							<CalcButton text="3" onPress={() => handlePress('3')} />
							<CalcButton icon={Icons.Divide} onPress={() => handlePress('÷')} isOperator />

							<CalcButton text="4" onPress={() => handlePress('4')} />
							<CalcButton text="5" onPress={() => handlePress('5')} />
							<CalcButton text="6" onPress={() => handlePress('6')} />
							<CalcButton icon={Icons.X} onPress={() => handlePress('×')} isOperator />

							<CalcButton text="7" onPress={() => handlePress('7')} />
							<CalcButton text="8" onPress={() => handlePress('8')} />
							<CalcButton text="9" onPress={() => handlePress('9')} />
							<CalcButton icon={Icons.Minus} onPress={() => handlePress('-')} isOperator />

							<CalcButton text="C" onPress={() => handlePress('C')} />
							<CalcButton text="0" onPress={() => handlePress('0')} />
							<CalcButton icon={Icons.Backspace} onPress={() => handlePress('back')} />
							<CalcButton icon={Icons.Plus} onPress={() => handlePress('+')} isOperator />

							<CalcButton icon={Icons.Equals} onPress={() => handlePress('=')} isEqual isDouble />
							<CalcButton text="Ok" onPress={handleConfirm} isDone isDouble />
						</View>
					</View>
				</LinearGradient>
			</View>
		</Modal>
	);
};

export default CalculatorModal;
