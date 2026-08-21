import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { ConfirmModal } from '@/components/ConfirmModal';
import Input from '@/components/Input';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { auth } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const router = useRouter();

	const handleLogin = async () => {
		if (!email.trim() || !password.trim()) {
			showMessage({
				message: 'Помилка',
				description: 'Будь ласка, заповніть усі поля',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}

		setIsLoading(true);

		try {
			await signInWithEmailAndPassword(auth, email.trim(), password);
			router.replace('/(tabs)');
		} catch (error: any) {
			let errorMessage = 'Не вдалося увійти. Спробуйте пізніше';
			switch (error.code) {
				case 'auth/invalid-email':
					errorMessage = 'Введено некоректну ел. адресу';
					break;
				case 'auth/user-not-found':
				case 'auth/invalid-credential':
					errorMessage = 'Невірний пароль або користувача не існує';
					break;
				case 'auth/user-disabled':
					errorMessage = 'Цей обліковий запис було заблоковано';
					break;
			}
			showMessage({
				message: 'Помилка',
				description: errorMessage,
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleForgotPassword = () => {
		if (!email.trim()) {
			showMessage({
				message: 'Відновлення пароля',
				description: 'Будь ласка, спочатку введіть свою ел. адресу.',
				type: 'warning',
				backgroundColor: colors.gradientMid,
				color: colors.orange,
			});
			return;
		}
		setConfirmVisible(true);
	};

	const executePasswordReset = async () => {
		setConfirmVisible(false);
		try {
			await sendPasswordResetEmail(auth, email.trim());
			showMessage({
				message: 'Успішно',
				description: 'Лист для зміни пароля надіслано! Перевірте пошту (включаючи папку Спам).',
				type: 'success',
				backgroundColor: colors.gradientMid,
				color: colors.primary,
			});
		} catch (error: any) {
			let errorText = 'Не вдалося надіслати лист. Спробуйте пізніше.';
			if (error.code === 'auth/invalid-email') {
				errorText = 'Введено некоректну ел. адресу';
			}
			showMessage({
				message: 'Помилка',
				description: errorText,
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		}
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
						icon={<Icons.At size={26} color={colors.neutral300} weight="fill" />}
					/>

					<Input
						placeholder="Введіть свій пароль"
						secureTextEntry
						value={password}
						onChangeText={setPassword}
						icon={<Icons.Lock size={26} color={colors.neutral300} weight="fill" />}
					/>

					<Pressable onPress={handleForgotPassword} style={{ alignSelf: 'flex-end' }}>
						<Typo size={14} color={colors.text}>
							Забули пароль?
						</Typo>
					</Pressable>

					<Button loading={isLoading} onPress={handleLogin}>
						{isLoading ? (
							<ActivityIndicator color={colors.primaryLight} />
						) : (
							<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
								Вхід
							</Typo>
						)}
					</Button>
				</View>

				<View style={globalStyles.authFooter}>
					<Typo size={15}>Немає облікового запису?</Typo>
					<Pressable onPress={() => router.push('/(auth)/register')}>
						<Typo size={15} fontWeight={'700'} color={colors.primaryLight}>
							Зареєструватися
						</Typo>
					</Pressable>
				</View>
			</View>

			<ConfirmModal
				visible={confirmVisible}
				title="Скидання пароля"
				message={`Надіслати інструкцію для зміни пароля на адресу ${email.trim()}?`}
				confirmText="Надіслати"
				cancelText="Скасувати"
				onConfirm={executePasswordReset}
				onCancel={() => setConfirmVisible(false)}
			/>
		</ScreenWrapper>
	);
};

export default Login;
