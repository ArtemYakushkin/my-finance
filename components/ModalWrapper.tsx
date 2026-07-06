import { globalStyles } from '@/constants/global';
import { MAIN_GRADIENT } from '@/constants/gradient';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
	Platform,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
	ViewStyle,
} from 'react-native';

type ModalWrapperProps = {
	style?: ViewStyle;
	children: React.ReactNode;
	bg?: string;
};

const ModalWrapper = ({ style, children }: ModalWrapperProps) => {
	const router = useRouter();

	return (
		<View style={globalStyles.modalWrap}>
			<TouchableWithoutFeedback onPress={() => router.back()}>
				{Platform.OS === 'ios' ? (
					<BlurView
						intensity={40}
						tint="dark"
						style={[StyleSheet.absoluteFill]}
					/>
				) : (
					<View
						style={[
							StyleSheet.absoluteFill,
							{ backgroundColor: 'rgba(0, 0, 0, 0.8)' },
						]}
					/>
				)}
			</TouchableWithoutFeedback>

			<LinearGradient
				{...(MAIN_GRADIENT as any)}
				style={[globalStyles.modalContent, style]}
			>
				<View style={globalStyles.modalHandle} />
				{children}
			</LinearGradient>
		</View>
	);
};

export default ModalWrapper;
