import { colors } from '@/constants/theme';
import { TouchableOpacity } from 'react-native';
import Typo from './Typo';

interface CalcButtonProps {
	text: string;
	onPress: () => void;
	isDone?: boolean;
	isEqual?: boolean;
	isDouble?: boolean;
}

const CalcButtonOperators = ({ text, onPress, isDone, isEqual, isDouble }: CalcButtonProps) => {
	let textColor = colors.neutral400;

	if (isEqual) textColor = colors.primary;
	if (isDone) {
		textColor = colors.primaryLight;
	}

	return (
		<TouchableOpacity onPress={onPress}>
			<Typo size={40} fontWeight="600" color={textColor}>
				{text}
			</Typo>
		</TouchableOpacity>
	);
};

export default CalcButtonOperators;
