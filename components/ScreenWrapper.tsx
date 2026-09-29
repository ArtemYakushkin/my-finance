import { getGradients } from '@/constants/gradient';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, Platform, StatusBar, View, ViewStyle } from 'react-native';

type ScreenWrapperProps = {
	style?: ViewStyle;
	children: React.ReactNode;
};

const { height } = Dimensions.get('window');

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
	let paddingTop = Platform.OS == 'ios' ? height * 0.06 : 50;
	const { colors } = useTheme();
	const { MAIN_GRADIENT } = getGradients(colors);

	return (
		<LinearGradient {...(MAIN_GRADIENT as any)} style={[{ paddingTop, flex: 1 }, style]}>
			<StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
			<View style={{ flex: 1 }}>{children}</View>
		</LinearGradient>
	);
};

export default ScreenWrapper;
