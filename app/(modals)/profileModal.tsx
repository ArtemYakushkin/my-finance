import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { getGlobalStyles } from '@/constants/global';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import { getProfileImage } from '@/services/imageService';
import { showErrorToast, showWarningToast } from '@/utils/showToast';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

type UserDataType = {
	name: string;
	image: string | null;
};

const ProfileModal = () => {
	const { user, updateUser } = useAuth();
	const router = useRouter();
	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);
	const [userData, setUserData] = useState<UserDataType>({
		name: '',
		image: null,
	});
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (user) {
			setUserData({
				name: user?.name || '',
				image: user?.image || null,
			});
		}
	}, [user]);

	const onPickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.4,
		});

		if (!result.canceled && result.assets && result.assets.length > 0) {
			setUserData((prev) => ({ ...prev, image: result.assets[0].uri }));
		}
	};

	const onSubmit = async () => {
		const { name, image } = userData;

		if (!name.trim()) {
			showWarningToast('Будь ласка, заповніть усі поля');
			return;
		}
		setLoading(true);
		const res = await updateUser(user?.uid as string, { name: name.trim(), image });
		setLoading(false);

		if (res.success) {
			if (router.canGoBack()) {
				router.back();
			}
		} else {
			showErrorToast(res.msg || 'Помилка оновлення');
		}
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
				<Header title={'Оновити профіль'} leftIcon={<BackButton />} />

				<ScrollView contentContainerStyle={globalStyles.modalForm} keyboardShouldPersistTaps="handled">
					<View style={globalStyles.modalAvatarContainer}>
						<Image
							style={globalStyles.modalAvatar}
							source={getProfileImage(userData.image)}
							contentFit="cover"
							transition={150}
						/>
						<TouchableOpacity onPress={onPickImage} style={globalStyles.modalEditIcon} activeOpacity={0.7}>
							<Icons.Pencil size={20} color={isDark ? colors.neutral800 : colors.neutral300} />
						</TouchableOpacity>
					</View>

					<View style={{ gap: 10 }}>
						<Typo color={colors.neutral200} size={16}>
							Ім'я
						</Typo>
						<Input
							placeholder="Ім'я"
							value={userData.name}
							onChangeText={(value) => setUserData({ ...userData, name: value })}
						/>
					</View>
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				<Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
					<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
						Оновити
					</Typo>
				</Button>
			</View>
		</ModalWrapper>
	);
};

export default ProfileModal;
