import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { TextInput, TextInputProps, TextStyle, View, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
	icon?: React.ReactNode;
	containerStyle?: ViewStyle;
	inputStyle?: TextStyle;
	inputRef?: React.RefObject<TextInput>;
}

const Input = (props: InputProps) => {
	return (
		<View style={[props.containerStyle, { alignSelf: 'stretch' }]}>
			<View style={globalStyles.inputBaseBackground}>
				<View style={globalStyles.inputContent}>
					{props.icon && props.icon}
					<TextInput
						style={[globalStyles.input, props.inputStyle]}
						placeholderTextColor={colors.neutral400}
						cursorColor={colors.primaryLight}
						{...props}
					/>
				</View>
			</View>
		</View>
	);
};

export default Input;
