import { colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { Text, TextProps, TextStyle } from 'react-native';

type TypoProps = {
	size?: number;
	color?: string;
	fontWeight?: TextStyle['fontWeight'];
	children: any | null;
	style?: TextStyle;
	textProps?: TextProps;
};

const Typo = ({ size, color = colors.neutral100, fontWeight = '400', children, style, textProps = {} }: TypoProps) => {
	const { isDark } = useTheme();
	const textStyle: TextStyle = {
		fontSize: size ? size : 18,
		color,
		fontWeight,
	};
	return (
		<Text style={[textStyle, style]} {...textProps}>
			{children}
		</Text>
	);
};

export default Typo;
