import { colors } from '@/constants/theme';
import { ActivityIndicator, ActivityIndicatorProps, View } from 'react-native';

const Loading = ({
	size = 'large',
	color = colors.primaryLight,
}: ActivityIndicatorProps) => {
	return (
		<View
			style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
		>
			<ActivityIndicator size={size} color={color} />
		</View>
	);
};

export default Loading;
