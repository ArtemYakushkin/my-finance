import Button from '@/components/Button';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const Welcome = () => {
	const router = useRouter();

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	return (
		<ScreenWrapper>
			<View style={globalStyles.welcomeContainer}>
				<View>
					<TouchableOpacity style={globalStyles.welcomeButton} onPress={() => router.push('/(auth)/login')}>
						<Typo fontWeight={'700'} color={colors.primaryLight}>
							Увійти
						</Typo>
					</TouchableOpacity>

					<Animated.Image
						entering={FadeIn.duration(2000)}
						source={require('../../assets/images/welcome-img.png')}
						style={globalStyles.welcomeImage}
					/>
				</View>

				<View style={globalStyles.welcomeFooter}>
					<View style={{ alignItems: 'center' }}>
						<Typo size={26} fontWeight={'800'} color={colors.neutral300}>
							Фінанси
						</Typo>
						<Typo size={26} fontWeight={'800'} color={colors.neutral300}>
							під контролем
						</Typo>
					</View>

					<View style={globalStyles.welcomeBtnContainer}>
						<Button onPress={() => router.push('/(auth)/register')}>
							<Typo size={21} color={colors.primaryLight} fontWeight={'700'}>
								Почати
							</Typo>
						</Button>
					</View>
				</View>
			</View>
		</ScreenWrapper>
	);
};

export default Welcome;
