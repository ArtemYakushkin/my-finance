import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT } from '@/constants/gradient';
import { SHADOW_BUTTON } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { Shadow } from 'react-native-shadow-2';

type BackButtonProps = {
	style?: ViewStyle;
	iconSize?: number;
	onPress: () => void;
};

const BackBtnModal = ({ style, iconSize = 26, onPress }: BackButtonProps) => {
	const router = useRouter();

	return (
		<View style={[{ alignSelf: 'flex-start', zIndex: 99 }, style]}>
			<Shadow {...SHADOW_BUTTON.light} style={{ borderRadius: 12, alignSelf: 'stretch' }}>
				<Shadow {...SHADOW_BUTTON.dark} style={{ alignSelf: 'stretch' }}>
					<TouchableOpacity
						onPress={onPress}
						activeOpacity={0.9}
						style={{ borderRadius: 12, overflow: 'hidden' }}
					>
						<LinearGradient {...BUTTON_GRADIENT} style={globalStyles.buttonBack}>
							<CaretLeftIcon size={iconSize} color={colors.primaryLight} weight="bold" />
						</LinearGradient>
					</TouchableOpacity>
				</Shadow>
			</Shadow>
		</View>
	);
};

export default BackBtnModal;
