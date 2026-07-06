import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { TouchableOpacity, View } from 'react-native';
import Typo from './Typo';

interface CalcButtonProps {
	text: string;
	onPress: () => void;
	isDone?: boolean;
	isEqual?: boolean;
	isDouble?: boolean;
}

const CalcButton = ({ text, onPress, isDone, isEqual, isDouble }: CalcButtonProps) => {
	let textColor = colors.neutral400;

	if (isEqual) textColor = colors.primary;
	if (isDone) {
		textColor = colors.primaryLight;
	}

	return (
		<View style={[globalStyles.calcButtonWrapper, isDouble && globalStyles.calcButtonDouble]}>
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={0.8}
				style={{
					borderRadius: 12,
					borderWidth: 1,
					borderColor: colors.neutral300,
					paddingVertical: 10,
					alignItems: 'center',
				}}
			>
				{text === 'back' ? (
					<Icons.Backspace size={22} color={textColor} weight="bold" style={{ paddingVertical: 3 }} />
				) : (
					<Typo size={20} fontWeight="700" color={textColor}>
						{text}
					</Typo>
				)}
			</TouchableOpacity>
		</View>
	);
};

export default CalcButton;
