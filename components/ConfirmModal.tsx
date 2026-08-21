import { globalStyles } from '@/constants/global';
import { INPUT_GRADIENT } from '@/constants/gradient';
import { colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, View } from 'react-native';
import Button from './Button';
import Typo from './Typo';

type ConfirmModalProps = {
	visible: boolean;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export const ConfirmModal = ({
	visible,
	title,
	message,
	confirmText = 'Підтвердити',
	cancelText = 'Скасувати',
	onConfirm,
	onCancel,
}: ConfirmModalProps) => {
	return (
		<Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
			<View style={globalStyles.confOverlay}>
				<LinearGradient {...INPUT_GRADIENT} style={globalStyles.confModalBox}>
					<Typo
						fontWeight={600}
						size={18}
						color={colors.neutral200}
						style={{ marginBottom: 12, textAlign: 'center' }}
					>
						{title}
					</Typo>

					<Typo
						size={14}
						color={colors.neutral300}
						style={{ marginBottom: 24, textAlign: 'center', lineHeight: 20 }}
					>
						{message}
					</Typo>

					<View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
						<Button onPress={onCancel}>
							<Typo size={14} fontWeight={500} color={colors.rose}>
								{cancelText}
							</Typo>
						</Button>

						<Button onPress={onConfirm}>
							<Typo size={14} fontWeight={500} color={colors.primary}>
								{confirmText}
							</Typo>
						</Button>
					</View>
				</LinearGradient>
			</View>
		</Modal>
	);
};
