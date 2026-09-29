import { getGlobalStyles } from '@/constants/global';
import { getGradients } from '@/constants/gradient';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';

type ModalWrapperProps = {
	style?: ViewStyle;
	children: React.ReactNode;
	bg?: string;
};

const ModalWrapper = ({ style, children }: ModalWrapperProps) => {
	const router = useRouter();
	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors);
	const { MAIN_GRADIENT } = getGradients(colors);

	return (
		<View style={globalStyles.modalWrap}>
			<TouchableWithoutFeedback onPress={() => router.back()}>
				{Platform.OS === 'ios' ? (
					<BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill]} />
				) : (
					<View
						style={[
							StyleSheet.absoluteFill,
							{ backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(221, 221, 221, 0.8)' },
						]}
					/>
				)}
			</TouchableWithoutFeedback>

			<LinearGradient {...(MAIN_GRADIENT as any)} style={[globalStyles.modalContent, style]}>
				<View style={globalStyles.modalHandle} />
				{children}
			</LinearGradient>
		</View>
	);
};

export default ModalWrapper;
