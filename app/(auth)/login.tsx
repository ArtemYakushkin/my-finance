import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Input from '@/components/Input';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { auth } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import {
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
} from 'firebase/auth';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	// 1. Функция авторизации
	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			Alert.alert('Помилка', 'Будь ласка, заповніть усі поля');
			return;
		}

		setIsLoading(true);

		try {
			await signInWithEmailAndPassword(auth, email.trim(), password);
			// Если всё ок, корневой _layout сам перенаправит на /(tabs) благодаря onAuthStateChanged
			router.replace('/(tabs)');
		} catch (error: any) {
			console.error(error.code);

			// Красивая обработка частых ошибок авторизации
			switch (error.code) {
				case 'auth/invalid-email':
					Alert.alert('Помилка', 'Введено некоректну ел. адресу');
					break;
				case 'auth/user-not-found':
				case 'auth/invalid-credential':
					Alert.alert(
						'Помилка',
						'Невірний пароль або користувача не існує',
					);
					break;
				case 'auth/user-disabled':
					Alert.alert(
						'Помилка',
						'Цей обліковий запис було заблоковано',
					);
					break;
				default:
					Alert.alert(
						'Помилка',
						'Не вдалося увійти. Спробуйте пізніше',
					);
					break;
			}
		} finally {
			setIsLoading(false);
		}
	};

	// 2. Функция восстановления пароля
	const handleForgotPassword = () => {
		if (!email.trim()) {
			Alert.alert(
				'Відновлення пароля',
				'Будь ласка, спочатку введіть свою ел. адресу в поле вводу, щоб ми знали, куди надіслати лист.',
			);
			return;
		}

		Alert.alert(
			'Скидання пароля',
			`Надіслати інструкцію для зміни пароля на адресу ${email.trim()}?`,
			[
				{ text: 'Скасувати', style: 'cancel' },
				{
					text: 'Надіслати',
					onPress: async () => {
						try {
							await sendPasswordResetEmail(auth, email.trim());
							Alert.alert(
								'Успішно',
								'Лист для зміни пароля надіслано! Перевірте вашу пошту (включаючи папку Спам).',
							);
						} catch (error: any) {
							if (error.code === 'auth/invalid-email') {
								Alert.alert(
									'Помилка',
									'Введено некоректну ел. адресу',
								);
							} else {
								Alert.alert(
									'Помилка',
									'Не вдалося надіслати лист. Спробуйте пізніше.',
								);
							}
						}
					},
				},
			],
		);
	};

	return (
		<ScreenWrapper>
			<View style={globalStyles.authContainer}>
				<BackButton iconSize={28} />

				<View style={{ gap: 5, marginTop: 20 }}>
					<Typo size={30} fontWeight={'800'}>
						Хей,
					</Typo>
					<Typo size={30} fontWeight={'800'}>
						Ласкаво просимо назад
					</Typo>
				</View>

				<View style={globalStyles.authForm}>
					<Typo size={16} color={colors.textLighter}>
						Увійдіть, щоб відстежувати свої витрати
					</Typo>

					<Input
						placeholder="Введіть свою ел. адресу"
						keyboardType="email-address"
						autoCapitalize="none"
						textContentType="emailAddress"
						value={email}
						onChangeText={setEmail}
						icon={
							<Icons.At
								size={26}
								color={colors.neutral300}
								weight="fill"
							/>
						}
					/>

					<Input
						placeholder="Введіть свій пароль"
						secureTextEntry
						value={password}
						onChangeText={setPassword}
						icon={
							<Icons.Lock
								size={26}
								color={colors.neutral300}
								weight="fill"
							/>
						}
					/>

					<Pressable
						onPress={handleForgotPassword}
						style={{ alignSelf: 'flex-end' }}
					>
						<Typo size={14} color={colors.text}>
							Забули пароль?
						</Typo>
					</Pressable>

					<Button loading={isLoading} onPress={handleLogin}>
						{isLoading ? (
							<ActivityIndicator color={colors.primaryLight} />
						) : (
							<Typo
								fontWeight={'700'}
								color={colors.primaryLight}
								size={21}
							>
								Вхід
							</Typo>
						)}
					</Button>
				</View>

				<View style={globalStyles.authFooter}>
					<Typo size={15}>Немає облікового запису?</Typo>
					<Pressable onPress={() => router.push('/(auth)/register')}>
						<Typo
							size={15}
							fontWeight={'700'}
							color={colors.primaryLight}
						>
							Зареєструватися
						</Typo>
					</Pressable>
				</View>
			</View>
		</ScreenWrapper>
	);
};

export default Login;
