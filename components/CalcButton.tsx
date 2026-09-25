import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { IconProps } from 'phosphor-react-native';
import { TouchableOpacity, View } from 'react-native';
import Typo from './Typo';

interface CalcButtonProps {
	text?: string;
	icon?: React.ComponentType<IconProps>;
	onPress: () => void;
	isDone?: boolean;
	isEqual?: boolean;
	isDouble?: boolean;
	isOperator?: boolean;
}

const CalcButton = ({ text, icon: Icon, onPress, isDone, isEqual, isDouble, isOperator }: CalcButtonProps) => {
	let textColor = colors.neutral100;
	let textSize = 20;

	if (isEqual) textColor = colors.primary;
	if (isDone) {
		textColor = colors.primaryLight;
	}
	if (isOperator) textColor = colors.orange;
	if (isOperator) textSize = 28;

	return (
		<View style={[globalStyles.calcButtonWrapper, isDouble && globalStyles.calcButtonDouble]}>
			<TouchableOpacity
				onPress={onPress}
				style={{
					height: 54,
					alignItems: 'center',
					justifyContent: 'center',
					borderWidth: 0.5,
					borderRadius: 12,
					borderColor: colors.neutral500,
				}}
			>
				{Icon ? (
					<Icon size={22} color={textColor} weight="bold" />
				) : (
					<Typo size={textSize} fontWeight="700" color={textColor}>
						{text}
					</Typo>
				)}
			</TouchableOpacity>
		</View>
	);
};

export default CalcButton;
