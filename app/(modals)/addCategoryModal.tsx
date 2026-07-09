import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase'; // Путь к твоему Firebase конфигу
import { globalStyles } from '@/constants/global';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/useAuth'; // Твой контекст авторизации
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

// Статический массив групп категорий (вынесен за пределы компонента)
const categoryGroups = [
	{ label: 'База', value: 'needs', color: colors.primary },
	{ label: 'Хочу', value: 'desires', color: colors.rose },
	{ label: 'Резерв', value: 'saving', color: colors.primaryLight },
];

const AddCategoryModal = () => {
	const router = useRouter();
	const { user } = useAuth();

	// Получаем параметры из урла (например, если перешли с экрана расходов или доходов)
	const { type, group } = useLocalSearchParams<{ type: string; group: string }>();

	const [loading, setLoading] = useState(false);

	// Объединяем стейт в объект, чтобы он идеально ложился на твой JSX
	const [category, setCategory] = useState({
		name: '',
		type: type || 'expense', // 'expense' или 'income'
		group: group || 'needs', // 'needs', 'desires', 'saving'
	});

	const handleSaveCategory = async () => {
		if (!category.name.trim()) {
			Alert.alert('Помилка', 'Введіть назву підкатегорії');
			return;
		}

		if (!user?.uid) {
			Alert.alert('Помилка', 'Користувач не авторизован');
			return;
		}

		setLoading(true);
		try {
			// Сохраняем в коллекцию categories под текущего юзера
			await addDoc(collection(db, 'categories'), {
				uid: user.uid,
				name: category.name.trim(),
				type: category.type,
				group: category.group,
				createdAt: serverTimestamp(),
			});

			// Возвращаемся назад после успешного сохранения
			router.back();
		} catch (error) {
			console.error('Ошибка при сохранении категории: ', error);
			Alert.alert('Помилка', 'Не вдалося зберегти категорію. Спробуйте ще раз.');
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
					{/* Поле ввода имени подкатегории */}
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

					{/* Селектор группы (только если это расход 'expense') */}
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

			{/* Кнопка "Зберегти" в футере модалки */}
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
