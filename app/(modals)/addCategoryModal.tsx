import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase';
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

const categoryGroups = [
	{ label: 'База', value: 'needs', color: colors.primary },
	{ label: 'Хочу', value: 'desires', color: colors.rose },
	{ label: 'Резерв', value: 'saving', color: colors.primaryLight },
];

const AddCategoryModal = () => {
	const router = useRouter();
	const { user } = useAuth();
	const { type, group } = useLocalSearchParams<{ type: string; group: string }>();

	const [loading, setLoading] = useState(false);
	const [category, setCategory] = useState({
		name: '',
		type: type || 'expense',
		group: group || 'needs',
	});

	const handleSaveCategory = async () => {
		if (!category.name.trim()) {
			showMessage({
				message: 'Помилка',
				description: 'Введіть назву підкатегорії',
				type: 'warning',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}

		if (!user?.uid) {
			showMessage({
				message: 'Помилка',
				description: 'Користувач не авторизован',
				type: 'warning',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
			return;
		}

		setLoading(true);
		try {
			await addDoc(collection(db, 'categories'), {
				uid: user.uid,
				name: category.name.trim(),
				type: category.type,
				group: category.group,
				createdAt: serverTimestamp(),
			});
			router.back();
		} catch (error) {
			showMessage({
				message: 'Помилка',
				description: 'Не вдалося зберегти категорію. Спробуйте ще раз',
				type: 'warning',
				backgroundColor: colors.gradientMid,
				color: colors.rose,
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container, { justifyContent: 'space-between' }]}>
				<Header title={'Нова категорія'} leftIcon={<BackButton />} />

				<ScrollView
					contentContainerStyle={globalStyles.modalForm}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<View style={{ gap: 10, paddingHorizontal: 5 }}>
						<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 5 }}>
							Назва підкатегорії
						</Typo>
						<Input
							placeholder="Наприклад: Продукти або Житло"
							value={category.name}
							onChangeText={(value) => setCategory({ ...category, name: value })}
						/>
					</View>

					{category.type === 'expense' && (
						<View style={{ gap: 10, marginTop: 15 }}>
							<Typo color={colors.neutral200} size={16} style={{ paddingLeft: 10 }}>
								Виберіть групу
							</Typo>
							<View style={globalStyles.modalBtnWrap}>
								{categoryGroups.map((groupItem) => {
									const isActive = category.group === groupItem.value;
									return (
										<Button
											key={groupItem.value}
											onPress={() => setCategory({ ...category, group: groupItem.value })}
											style={{
												flex: 1,
											}}
										>
											<Typo
												size={14}
												fontWeight={isActive ? '700' : '500'}
												color={isActive ? groupItem.color : colors.neutral400}
											>
												{groupItem.label}
											</Typo>
										</Button>
									);
								})}
							</View>
						</View>
					)}
				</ScrollView>
			</View>

			<View style={globalStyles.modalFooter}>
				<Button onPress={handleSaveCategory} loading={loading} disabled={loading} style={{ flex: 1 }}>
					<Typo fontWeight={'700'} color={colors.primaryLight} size={21}>
						Зберегти
					</Typo>
				</Button>
			</View>
		</ModalWrapper>
	);
};

export default AddCategoryModal;
