import { getGlobalStyles } from '@/constants/global';
import { getGradients } from '@/constants/gradient';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native';
import { TouchableOpacity, ViewStyle } from 'react-native';

type BackButtonProps = {
	style?: ViewStyle;
	iconSize?: number;
};

const BackButton = ({ style, iconSize = 26 }: BackButtonProps) => {
	const router = useRouter();

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors);
	const gradients = getGradients(colors);
	const buttonGradient = isDark ? gradients.BUTTON_GRADIENT : gradients.BUTTON_GRADIENT_WHITE;

	return (
		<TouchableOpacity
			onPress={(e) => {
				e.currentTarget.blur();
				if (router.canGoBack()) {
					router.back();
				}
			}}
			activeOpacity={0.8}
			style={{
				borderRadius: 12,
			}}
		>
			<LinearGradient
				colors={buttonGradient.colors}
				start={buttonGradient.start}
				end={buttonGradient.end}
				style={globalStyles.buttonBack}
			>
				<CaretLeftIcon size={iconSize} color={colors.primaryLight} weight="bold" />
			</LinearGradient>
		</TouchableOpacity>
	);
};

export default BackButton;
