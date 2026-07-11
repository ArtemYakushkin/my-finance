import { globalStyles } from '@/constants/global';
import { MAIN_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { getProfileImage } from '@/services/imageService';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import BackBtnModal from './BackBtnModal';
import Button from './Button';
import Header from './Header';
import Input from './Input';
import Typo from './Typo';

type Props = {
	visible: boolean;
	onClose: () => void;
};

type UserDataType = {
	name: string;
	image: string | null; // Храним строку URI для картинки
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProfileModal = ({ visible, onClose }: Props) => {
	// Достаем метод updateUser из нашего обновленного контекста
	const { user, updateUser } = useAuth();

	const [userData, setUserData] = useState<UserDataType>({
		name: '',
		image: null,
	});
	const [loading, setLoading] = useState(false);

	// Синхронизируем внутренний стейт формы при открытии модалки
	useEffect(() => {
		if (visible && user) {
			setUserData({
				name: user?.name || '',
				image: user?.image || null,
			});
		}
	}, [user, visible]);

	const onPickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.4, // Немного сжимаем для экономии места в Firestore
		});

		if (!result.canceled && result.assets && result.assets.length > 0) {
			// Сохраняем локальный uri путь к картинке
			setUserData((prev) => ({ ...prev, image: result.assets[0].uri }));
		}
	};

	const onSubmit = async () => {
		const { name, image } = userData;

		if (!name.trim()) {
			Alert.alert('Користувач', 'Будь ласка, заповніть усі поля');
			return;
		}

		setLoading(true);

		// Передаем uid и объект с новыми данными
		const res = await updateUser(user?.uid as string, { name: name.trim(), image });

		setLoading(false); // Выключаем загрузку

		if (res.success) {
			// Так как у нас в ProfileModal кастомный onClose (управляющий стейтом),
			// вместо router.back() просто закрываем эту же модалку.
			onClose();
		} else {
			Alert.alert('Користувач', res.msg || 'Помилка оновлення');
		}
	};

	return (
		<Modal
			isVisible={visible}
			onBackdropPress={onClose}
			onBackButtonPress={onClose}
			swipeDirection="down"
			onSwipeComplete={onClose}
			propagateSwipe={true}
			style={globalStyles.calcModal}
			animationIn="slideInUp"
			animationOut="slideOutDown"
			backdropOpacity={0.7}
			deviceHeight={SCREEN_HEIGHT}
		>
			<LinearGradient
				{...(MAIN_GRADIENT as any)}
				style={[globalStyles.calcContainer, { height: SCREEN_HEIGHT * 0.95 }]}
			>
				<View style={globalStyles.calcHandle} />

				<Header title={'Оновити профіль'} leftIcon={<BackBtnModal onPress={onClose} />} />

				<ScrollView contentContainerStyle={globalStyles.modalForm} keyboardShouldPersistTaps="handled">
					<View style={globalStyles.modalAvatarContainer}>
						<Image
							style={globalStyles.modalAvatar}
							// Твой imageService должен уметь принимать строку-uri
							source={getProfileImage(userData.image)}
							contentFit="cover"
							transition={150}
						/>
						<TouchableOpacity onPress={onPickImage} style={globalStyles.modalEditIcon} activeOpacity={0.7}>
							<Icons.Pencil size={20} color={colors.neutral800} />
						</TouchableOpacity>
					</View>

					<View style={{ gap: 10, paddingHorizontal: 5 }}>
						<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
							Ім'я
						</Typo>
						<Input
							placeholder="Ім'я"
							value={userData.name}
							onChangeText={(value) => setUserData({ ...userData, name: value })}
						/>
					</View>
				</ScrollView>

				<View style={globalStyles.modalFooter}>
					<Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
						<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
							Оновити
						</Typo>
					</Button>
				</View>
			</LinearGradient>
		</Modal>
	);
};

export default ProfileModal;
