import { getGlobalStyles } from '@/constants/global';
import { getGradients } from '@/constants/gradient';
import { useTheme } from '@/context/ThemeContext';
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
	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors);
	const gradients = getGradients(colors);
	const buttonGradient = isDark ? gradients.BUTTON_GRADIENT : gradients.BUTTON_GRADIENT_WHITE;

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
					borderRadius: 12,
				},
				style,
			]}
			{...props}
		>
			<LinearGradient
				colors={buttonGradient.colors}
				start={buttonGradient.start}
				end={buttonGradient.end}
				style={globalStyles.button}
			>
				{children}
			</LinearGradient>
		</TouchableOpacity>
	);
};

export default Button;
