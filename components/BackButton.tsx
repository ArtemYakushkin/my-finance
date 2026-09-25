import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
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
				borderRadius: 17,
				overflow: 'hidden',
			}}
		>
			<LinearGradient {...BUTTON_GRADIENT} style={globalStyles.buttonBack}>
				<CaretLeftIcon size={iconSize} color={colors.primaryLight} weight="bold" />
			</LinearGradient>
		</TouchableOpacity>
	);
};

export default BackButton;
