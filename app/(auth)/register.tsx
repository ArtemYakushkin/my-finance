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
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

const Register = () => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleRegister = async () => {
		// 1. Локальная валидация перед отправкой запроса
		if (!name.trim()) {
			Alert.alert('Помилка', "Будь ласка, введіть своє ім'я");
			return;
		}

		if (!email.trim()) {
			Alert.alert('Помилка', 'Будь ласка, введіть ел. адресу');
			return;
		}

		if (password.length < 6) {
			Alert.alert('Помилка', 'Пароль має містити щонайменше 6 символів');
			return;
		}

		setIsLoading(true);

		try {
			// 1. Создаем пользователя в Firebase Authentication
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email.trim(),
				password,
			);
			const user = userCredential.user;

			// 2. Обновляем локальный профиль в Auth (опционально, для удобства)
			await updateProfile(user, {
				displayName: name.trim(),
			});

			// 3. Создаем документ пользователя в коллекции "users" в Firestore
			// Используем user.uid как ID документа
			await setDoc(doc(db, 'users', user.uid), {
				uid: user.uid,
				name: name.trim(),
				email: email.trim().toLowerCase(),
				avatar: '', // Изначально пустая строка (или ссылка на дефолтную картинку)
				currency: 'UAH',
				createdAt: new Date().toISOString(), // Полезно хранить дату регистрации
			});

			// 4. Перенаправление в приложение
			router.replace('/(tabs)');
		} catch (error: any) {
			console.error(error.code);

			// 5. Обработка специфических ошибок Firebase
			switch (error.code) {
				case 'auth/email-already-in-use':
					Alert.alert(
						'Помилка',
						'Користувач з такою ел. адресою вже існує',
					);
					break;
				case 'auth/invalid-email':
					Alert.alert('Помилка', 'Введено некоректну ел. адресу');
					break;
				case 'auth/weak-password':
					Alert.alert(
						'Помилка',
						'Пароль надто слабкий. Спробуйте інший',
					);
					break;
				case 'auth/network-request-failed':
					Alert.alert(
						'Помилка',
						'Проgeneric поєднання з мережею. Перевірте інтернет',
					);
					break;
				default:
					Alert.alert(
						'Помилка',
						'Щось пішло не так. Спробуйте пізніше',
					);
					break;
			}
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
						icon={
							<Icons.User
								size={26}
								color={colors.neutral300}
								weight="fill"
							/>
						}
					/>

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
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						icon={
							<Icons.Lock
								size={26}
								color={colors.neutral300}
								weight="fill"
							/>
						}
					/>

					<Button loading={isLoading} onPress={handleRegister}>
						{isLoading ? (
							<ActivityIndicator color={colors.primaryLight} />
						) : (
							<Typo
								fontWeight={'700'}
								color={colors.primaryLight}
								size={21}
							>
								Зареєструватися
							</Typo>
						)}
					</Button>
				</View>

				<View style={globalStyles.authFooter}>
					<Typo size={15}>Вже маєте обліковий запис?</Typo>
					<Pressable onPress={() => router.push('/(auth)/login')}>
						<Typo
							size={15}
							fontWeight={'700'}
							color={colors.primaryLight}
						>
							Вхід
						</Typo>
					</Pressable>
				</View>
			</View>
		</ScreenWrapper>
	);
};

export default Register;
