import BackButton from '@/components/BackButton';
import { ConfirmModal } from '@/components/ConfirmModal';
import Header from '@/components/Header';
import ModalWrapper from '@/components/ModalWrapper';
import Typo from '@/components/Typo';
import { db } from '@/config/firebase';
import { getGlobalStyles } from '@/constants/global';
import { categoryGroups } from '@/constants/types';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/useAuth';
import useFetchData from '@/hooks/useFetchData';
import { deleteCategoryAndRefundBalance } from '@/services/categoriesService';
import { showErrorToast, showSuccessToast } from '@/utils/showToast';
import { doc, updateDoc, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

interface CategoryItem {
	id: string;
	name: string;
	group: string;
	type: string;
	uid: string;
	order?: number;
}

const ManageCategoriesModal = () => {
	const { user } = useAuth();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [localCategories, setLocalCategories] = useState<CategoryItem[]>([]);
	const [editName, setEditName] = useState('');
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [confirmVisible, setConfirmVisible] = useState(false);
	const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

	const { colors, isDark } = useTheme();
	const globalStyles = getGlobalStyles(colors, isDark);

	const { data: firebaseCategories } = useFetchData<CategoryItem>(
		'categories',
		user?.uid ? [where('uid', '==', user?.uid)] : [],
	);

	useEffect(() => {
		const showSubscription = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(e) => setKeyboardHeight(e.endCoordinates.height),
		);
		const hideSubscription = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => setKeyboardHeight(0),
		);

		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, []);

	useEffect(() => {
		if (firebaseCategories) {
			const sorted = [...firebaseCategories].sort((a, b) => (a.order || 0) - (b.order || 0));
			setLocalCategories(sorted);
		}
	}, [firebaseCategories]);

	const handleDeletePress = (categoryName: string) => {
		setCategoryToDelete(categoryName);
		setConfirmVisible(true);
	};

	const handleConfirmDelete = async () => {
		if (!user?.uid || !categoryToDelete) return;

		setConfirmVisible(false);

		try {
			const res = await deleteCategoryAndRefundBalance(user.uid, categoryToDelete);
			if (res.success) {
				showSuccessToast(`Категорію "${categoryToDelete}" видалено`);
			} else {
				showErrorToast(res.msg || 'Не вдалося видалити категорію');
			}
		} catch (error) {
			showErrorToast('Щось пішло не так при видаленні');
		} finally {
			setCategoryToDelete(null);
		}
	};

	const handleSaveEdit = async (id: string) => {
		if (!editName.trim()) return;
		try {
			const catRef = doc(db, 'categories', id);
			await updateDoc(catRef, { name: editName.trim() });
			setEditingId(null);
		} catch (error) {
			showErrorToast('Не вдалося оновити назву');
		}
	};

	const renderCategoryRow = (item: CategoryItem) => {
		const isEditing = editingId === item.id;

		return (
			<View key={item.id} style={globalStyles.rowContainer}>
				<View style={globalStyles.rowNameContainer}>
					{isEditing ? (
						<TextInput
							style={globalStyles.rowInput}
							value={editName}
							onChangeText={setEditName}
							autoFocus
							onSubmitEditing={() => handleSaveEdit(item.id)}
							returnKeyType="done"
						/>
					) : (
						<Typo color={colors.neutral100} size={15}>
							{item.name}
						</Typo>
					)}
				</View>

				<View style={globalStyles.rowActions}>
					{isEditing ? (
						<TouchableOpacity onPress={() => handleSaveEdit(item.id)} style={globalStyles.rowActionBtn}>
							<Icons.Check color={colors.primaryLight || colors.neutral300} size={22} weight="bold" />
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							onPress={() => {
								setEditingId(item.id);
								setEditName(item.name);
							}}
							style={globalStyles.rowActionBtn}
						>
							<Icons.PencilSimple color={colors.neutral300} size={20} />
						</TouchableOpacity>
					)}

					<TouchableOpacity onPress={() => handleDeletePress(item.name)} style={globalStyles.rowActionBtn}>
						<Icons.Trash color={colors.rose || colors.rose} size={20} />
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	return (
		<ModalWrapper>
			<View style={[globalStyles.container]}>
				<Header title={'Менеджер категорій'} leftIcon={<BackButton />} />

				<ScrollView
					contentContainerStyle={[
						globalStyles.modalForm,
						{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 40 : 70 },
					]}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					{categoryGroups.map((group) => {
						const groupSubCategories = localCategories.filter(
							(cat) => cat.group === group.value && cat.type === 'expense',
						);

						return (
							<View key={group.value} style={{ marginBottom: 20 }}>
								<View style={{ marginBottom: 20 }}>
									<View
										style={{
											backgroundColor: colors.gradientMid,
											justifyContent: 'center',
											alignItems: 'center',
											paddingVertical: 12,
											borderRadius: 12,
										}}
									>
										<Typo color={group.color} size={24} fontWeight="700">
											{group.label}
										</Typo>
									</View>
								</View>

								{groupSubCategories.length > 0 ? (
									<View style={{ gap: 4 }}>
										{groupSubCategories.map((item) => renderCategoryRow(item))}
									</View>
								) : (
									<View
										style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 10 }}
									>
										<Typo color={colors.neutral300} size={14}>
											У цій групі ще немає підкатегорій
										</Typo>
									</View>
								)}
							</View>
						);
					})}
				</ScrollView>
			</View>

			<ConfirmModal
				visible={confirmVisible}
				title="Увага!"
				message={`Ви впевнені, що хочете видалити категорію "${categoryToDelete}"? Усі транзакції цієї категорії будуть видалені, а кошти повернуться на баланс гаманців.`}
				confirmText="Видалити"
				cancelText="Скасувати"
				onConfirm={handleConfirmDelete}
				onCancel={() => {
					setConfirmVisible(false);
					setCategoryToDelete(null);
				}}
			/>
		</ModalWrapper>
	);
};

export default ManageCategoriesModal;
