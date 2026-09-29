import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Loading from '@/components/Loading';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { auth, db } from '@/config/firebase';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { showErrorToast } from '@/utils/showToast';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

const Register = () => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const handleRegister = async () => {
		if (!name.trim()) {
			showErrorToast("Будь ласка, введіть своє ім'я");
			return;
		}
		if (!email.trim()) {
			showErrorToast('Будь ласка, введіть ел.адресу');
			return;
		}
		if (password.length < 6) {
			showErrorToast('Пароль має містити щонайменше 6 символів');
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
					errorMessage = 'Введено некоректну ел.адресу';
					break;
				case 'auth/weak-password':
					errorMessage = 'Пароль надто слабкий. Спробуйте інший';
					break;
				case 'auth/network-request-failed':
					errorMessage = "Проблема з мережею. Перевірте з'єднання з інтернетом";
					break;
			}
			showErrorToast(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<ScreenWrapper>
			<View style={globalStyles.authContainer}>
				<BackButton iconSize={28} />

				<View style={{ gap: 5, marginTop: 20, marginLeft: 5 }}>
					<Typo size={30} fontWeight={'800'} color={colors.neutral300}>
						Давайте
					</Typo>
					<Typo size={30} fontWeight={'800'} color={colors.neutral300}>
						починати!
					</Typo>
				</View>

				<View style={globalStyles.authForm}>
					<Input
						placeholder="Введіть своє ім'я"
						value={name}
						onChangeText={setName}
						icon={<Icons.User size={26} color={colors.neutral400} weight="fill" />}
					/>

					<Input
						placeholder="Введіть свою ел.адресу"
						keyboardType="email-address"
						autoCapitalize="none"
						textContentType="emailAddress"
						value={email}
						onChangeText={setEmail}
						icon={<Icons.At size={26} color={colors.neutral400} weight="fill" />}
					/>

					<Input
						placeholder="Введіть свій пароль"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						icon={<Icons.Lock size={26} color={colors.neutral400} weight="fill" />}
					/>

					<Button loading={isLoading} onPress={handleRegister}>
						{isLoading ? (
							<Loading />
						) : (
							<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
								Зареєструватися
							</Typo>
						)}
					</Button>
				</View>

				<View style={globalStyles.authFooter}>
					<Typo size={15} color={colors.neutral400}>
						Вже маєте обліковий запис?
					</Typo>
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
