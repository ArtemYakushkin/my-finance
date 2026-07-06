import { globalStyles } from '@/constants/global';
import { INPUT_GRADIENT } from '@/constants/gradient';
import { SHADOW_INPUT_AUTH } from '@/constants/shadow';
import { colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import {
	TextInput,
	TextInputProps,
	TextStyle,
	View,
	ViewStyle,
} from 'react-native';
import { Shadow } from 'react-native-shadow-2';

interface InputProps extends TextInputProps {
	icon?: React.ReactNode;
	containerStyle?: ViewStyle;
	inputStyle?: TextStyle;
	inputRef?: React.RefObject<TextInput>;
	//   label?: string;
	//   error?: string;
}

const Input = (props: InputProps) => {
	return (
		<View style={[props.containerStyle, { alignSelf: 'stretch' }]}>
			<View style={globalStyles.inputBaseBackground}>
				<Shadow
					{...SHADOW_INPUT_AUTH.light}
					style={{ alignSelf: 'stretch' }}
				>
					<Shadow
						{...SHADOW_INPUT_AUTH.dark}
						style={{ alignSelf: 'stretch' }}
					>
						<LinearGradient
							{...INPUT_GRADIENT}
							style={globalStyles.inputContainer}
						>
							<View style={globalStyles.inputContent}>
								{props.icon && props.icon}
								<TextInput
									style={[
										globalStyles.input,
										props.inputStyle,
									]}
									placeholderTextColor={colors.neutral400}
									cursorColor={colors.primary}
									{...props}
								/>
							</View>
						</LinearGradient>
					</Shadow>
				</Shadow>
			</View>
		</View>
	);
};

export default Input;
