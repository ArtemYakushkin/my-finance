import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Input from '@/components/Input';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { auth, db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

const Register = () => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleRegister = async () => {
		if (!name.trim()) {
			showMessage({
				message: 'Помилка',
				description: "Будь ласка, введіть своє ім'я",
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}
		if (!email.trim()) {
			showMessage({
				message: 'Помилка',
				description: 'Будь ласка, введіть ел. адресу',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}
		if (password.length < 6) {
			showMessage({
				message: 'Помилка',
				description: 'Пароль має містити щонайменше 6 символів',
				type: 'danger',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}
		setIsLoading(true);
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
			const user = userCredential.user;
			await updateProfile(user, {
				displayName: name.trim(),
			});
			await setDoc(doc(db, 'users', user.uid), {
				uid: user.uid,
				name: name.trim(),
				email: email.trim().toLowerCase(),
				avatar: '',
				currency: 'UAH',
				createdAt: new Date().toISOString(),
			});
			router.replace('/(tabs)');
		} catch (error: any) {
			let errorMessage = 'Не вдалося зареєструватися. Спробуйте пізніше';
			switch (error.code) {
				case 'auth/email-already-in-use':
					errorMessage = 'Користувач з такою ел. адресою вже існує';
					break;
				case 'auth/invalid-email':
					errorMessage = 'Введено некоректну ел. адресу';
					break;
				case 'auth/weak-password':
					errorMessage = 'Пароль надто слабкий. Спробуйте інший';
					break;
				case 'auth/network-request-failed':
					errorMessage = 'Проgeneric поєднання з мережею. Перевірте інтернет';
					break;
				default:
					console.log('Firebase auth error:', error.code);
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

	return (
		<ScreenWrapper>
			<View style={globalStyles.authContainer}>
				<BackButton iconSize={28} />

				<View style={{ gap: 5, marginTop: 20 }}>
					<Typo size={30} fontWeight={'800'}>
						Давайте
					</Typo>
					<Typo size={30} fontWeight={'800'}>
						Починати
					</Typo>
				</View>

				<View style={globalStyles.authForm}>
					<Typo size={16} color={colors.textLighter}>
						Створіть обліковий запис для відстеження своїх витрат
					</Typo>

					<Input
						placeholder="Введіть своє ім'я"
						value={name}
						onChangeText={setName}
						icon={<Icons.User size={26} color={colors.neutral300} weight="fill" />}
					/>

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
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						icon={<Icons.Lock size={26} color={colors.neutral300} weight="fill" />}
					/>

					<Button loading={isLoading} onPress={handleRegister}>
						{isLoading ? (
							<ActivityIndicator color={colors.primaryLight} />
						) : (
							<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
								Зареєструватися
							</Typo>
						)}
					</Button>
				</View>

				<View style={globalStyles.authFooter}>
					<Typo size={15}>Вже маєте обліковий запис?</Typo>
					<Pressable onPress={() => router.push('/(auth)/login')}>
						<Typo size={15} fontWeight={'700'} color={colors.primaryLight}>
							Вхід
						</Typo>
					</Pressable>
				</View>
			</View>
		</ScreenWrapper>
	);
};

export default Register;
