import { globalStyles } from '@/constants/global';
import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import Typo from './Typo';

type HeaderProps = {
	title?: string;
	style?: ViewStyle;
	leftIcon?: ReactNode;
	rightIcon?: ReactNode;
};

const Header = ({ title = '', leftIcon, style }: HeaderProps) => {
	return (
		<View style={[globalStyles.headerTop, style]}>
			{leftIcon && (
				<View style={globalStyles.headerIcon}>{leftIcon}</View>
			)}
			{title && (
				<Typo
					size={22}
					fontWeight={'600'}
					style={{
						textAlign: 'center',
						width: leftIcon ? '82%' : '100%',
					}}
				>
					{title}
				</Typo>
			)}
		</View>
	);
};

export default Header;
