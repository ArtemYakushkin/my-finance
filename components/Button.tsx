import { globalStyles } from '@/constants/global';
import { BUTTON_GRADIENT } from '@/constants/gradient';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, View, ViewStyle } from 'react-native';
import Loading from './Loading';

interface CustomButtonProps extends TouchableOpacityProps {
	style?: ViewStyle;
	onPress?: () => void;
	loading?: boolean;
	children: React.ReactNode;
}

const Button = ({ style, onPress, loading = false, children, ...props }: CustomButtonProps) => {
	if (loading) {
		return (
			<View style={[globalStyles.button, style, { backgroundColor: 'transparent' }]}>
				<Loading />
			</View>
		);
	}

	return (
		<TouchableOpacity
			onPress={onPress}
			activeOpacity={0.8}
			style={[
				{
					borderRadius: 17,
					overflow: 'hidden',
				},
				style,
			]}
			{...props}
		>
			<LinearGradient {...BUTTON_GRADIENT} style={globalStyles.button}>
				{children}
			</LinearGradient>
		</TouchableOpacity>
	);
};

export default Button;
