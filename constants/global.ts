import { colors } from '@/constants/theme';
import { Platform, StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
	mainContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},

	logo: {
		height: '20%',
		width: '40%',
		aspectRatio: 1,
	},

	container: {
		flex: 1,
		paddingHorizontal: 10,
	},

	// ----Header----

	headerTop: {
		width: '100%',
		alignItems: 'center',
		flexDirection: 'row',
		marginBottom: 10,
	},
	headerIcon: {
		alignSelf: 'flex-start',
	},

	// ----Modal Wrapper----

	modalWrap: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	modalContent: {
		height: '95%',
		width: '100%',
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		overflow: 'hidden',
		borderTopWidth: 1,
		borderLeftWidth: 0.5,
		borderRightWidth: 0.5,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	modalHandle: {
		width: 40,
		height: 5,
		backgroundColor: 'rgba(255,255,255,0.2)',
		borderRadius: 5,
		alignSelf: 'center',
		marginTop: 12,
		marginBottom: 10,
	},

	// ----Welcome----

	welcomeContainer: {
		flex: 1,
		justifyContent: 'space-between',
	},
	welcomeButton: {
		alignSelf: 'flex-end',
		marginRight: 20,
	},
	welcomeImage: {
		width: '100%',
		height: 450,
		alignSelf: 'center',
		marginTop: 30,
	},
	welcomeFooter: {
		alignItems: 'center',
		paddingTop: 30,
		paddingBottom: 72,
		gap: 20,
	},
	welcomeBtnContainer: {
		width: '100%',
		paddingHorizontal: 20,
	},

	// ----Auth----

	authContainer: {
		flex: 1,
		gap: 30,
		paddingRight: 20,
		paddingLeft: 20,
	},
	authForm: {
		gap: 20,
	},
	authFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 5,
	},

	// ----HomePage----

	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
	},
	searchIcon: {
		backgroundColor: colors.gradientStart,
		padding: 10,
		borderRadius: 50,
		borderColor: colors.neutral200,
		borderWidth: 1,
	},
	scrollViewStyle: {
		marginTop: 10,
		paddingBottom: 20,
		gap: 15,
	},
	addButton: {
		height: 50,
		width: 50,
		borderRadius: 100,
		position: 'absolute',
		bottom: 30,
		right: 20,
	},

	// ----Card----

	bgImageCard: {
		height: 240,
		width: '100%',
	},
	containerCard: {
		padding: 20,
		paddingHorizontal: 23,
		height: '87%',
		justifyContent: 'space-between',
	},
	totalBalanceCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 5,
	},
	statsCard: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	incomeExpenseCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 7,
	},
	statsIconCard: {
		backgroundColor: colors.neutral350,
		padding: 5,
		borderRadius: 50,
	},

	// ----Transaction List----

	transRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 12,
		backgroundColor: 'rgba(41, 46, 58, 0.07)',
		padding: 12,
		borderRadius: 17,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	transIcon: {
		height: 44,
		aspectRatio: 1,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 12,
		borderCurve: 'continuous',
	},
	transCategoryDes: {
		flex: 1,
		gap: 3,
	},
	transAmountDate: {
		alignItems: 'flex-end',
		gap: 3,
	},

	// ----Statistics----

	statScrollContent: {
		paddingTop: 20,
		paddingBottom: 30,
	},
	statSegmentWrap: {
		flexDirection: 'row',
		height: 46,
		borderRadius: 15,
		padding: 4,
		backgroundColor: colors.gradientMid,
	},
	statSegmentBtn: {
		flex: 1,
		justifyContent: 'center',
	},
	statSegmentActive: {
		flex: 1,
		backgroundColor: '#1c1f26',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	statDateWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	statPieInner: {
		padding: 15,
		borderRadius: 20,
		minHeight: 200,
		alignItems: 'center',
	},
	statPieContainer: {
		alignItems: 'center',
		gap: 15,
		width: '100%',
	},
	statPieLegend: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		gap: 12,
	},
	statPieLegendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	statPieLegendDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	noDataContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 100,
	},
	statCategoryCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 12,
		borderRadius: 15,
	},
	statCategoryInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	statIconWrapper: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 10,
	},

	// ----Wallet----

	walletContainer: {
		flex: 1,
		justifyContent: 'space-between',
	},
	walletBalance: {
		height: 160,
		justifyContent: 'center',
		alignItems: 'center',
	},
	walletBlock: {
		flex: 1,
		borderTopRightRadius: 30,
		borderTopLeftRadius: 30,
		paddingHorizontal: 10,
		paddingTop: 25,
		borderTopWidth: 2,
		borderTopColor: colors.gradientMid,
	},
	walletFlexRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 10,
		marginBottom: 25,
	},
	walletItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 17,
		padding: 12,
		backgroundColor: 'rgba(41, 46, 58, 0.07)',
		borderRadius: 17,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	walletImage: {
		height: 45,
		width: 45,
		overflow: 'hidden',
	},
	walletName: {
		flex: 1,
		gap: 2,
		marginLeft: 10,
	},

	// ----Profile----

	profileInfo: {
		marginTop: 30,
		alignItems: 'center',
		gap: 15,
	},
	profileAvatar: {
		height: 135,
		width: 135,
		borderRadius: 200,
		borderWidth: 1.5,
		borderColor: 'rgba(255, 255, 255, 0.05)',
	},
	profileNameContainer: {
		gap: 4,
		alignItems: 'center',
		marginTop: 5,
		marginBottom: 40,
	},
	profileOptions: {
		borderRadius: 20,
		paddingHorizontal: 15,
		backgroundColor: '#171921',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.03)',
	},
	profileOptionsItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 15,
		paddingVertical: 12,
	},
	profileOptionsIcon: {
		height: 40,
		width: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 12,
	},
	profileOptionsSeparator: {
		height: 0.5,
		backgroundColor: 'rgba(255, 255, 255, 0.06)',
		marginHorizontal: 5,
	},

	// ----Modal----

	modalForm: {
		gap: 20,
		marginTop: 15,
	},
	modalBtnWrap: {
		flexDirection: 'row',
		gap: 6,
		paddingHorizontal: 5,
	},
	modalDropdownShadowHolder: {
		paddingHorizontal: 8,
		paddingVertical: 5,
	},
	modalDropdownContainer: {
		height: 54,
		borderWidth: 1,
		paddingHorizontal: 15,
		borderCurve: 'continuous',
		backgroundColor: '#292e3a',
		borderRadius: 17,
		borderColor: '#1B1B1B',
	},
	modalAddCategory: {
		flexDirection: 'row',
		gap: 15,
		alignItems: 'center',
		paddingLeft: 6,
	},
	modalInputContainer: {
		alignSelf: 'stretch',
		overflow: 'hidden',
		borderRadius: 17,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.03)',
	},
	modalInputInner: {
		flexDirection: 'row',
		height: 54,
		alignItems: 'center',
		gap: 10,
		borderRadius: 17,
	},
	modalInput: {
		width: '100%',
		height: 54,
		justifyContent: 'center',
		paddingHorizontal: 15,
	},
	modalFooter: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		paddingHorizontal: 10,
		paddingTop: 15,
		borderTopColor: colors.neutral700,
		borderTopWidth: 1,
		marginBottom: 60,
	},
	modalAvatarContainer: {
		position: 'relative',
		alignSelf: 'center',
	},
	modalAvatar: {
		alignSelf: 'center',
		backgroundColor: colors.neutral300,
		height: 135,
		width: 135,
		borderRadius: 200,
		borderWidth: 1,
		borderColor: colors.neutral500,
	},
	modalEditIcon: {
		position: 'absolute',
		bottom: 5,
		right: 7,
		borderRadius: 100,
		backgroundColor: colors.neutral300,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.25,
		shadowRadius: 10,
		elevation: 4,
		padding: 7,
	},
	calcModal: {
		justifyContent: 'flex-end',
		margin: 0,
	},
	calcContainer: {
		borderTopLeftRadius: 30,
		borderTopRightRadius: 30,
		paddingBottom: 30,
		paddingHorizontal: 10,
	},
	calcHandle: {
		width: 40,
		height: 5,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 10,
		alignSelf: 'center',
		marginVertical: 15,
	},
	calcDisplayWrapper: {
		marginHorizontal: 20,
		marginBottom: 20,
		marginTop: 20,
	},
	calcDisplayInner: {
		alignItems: 'center',
		height: 60,
		justifyContent: 'center',
		overflow: 'hidden',
	},
	calcButtonOperators: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 34,
		marginBottom: 20,
	},
	calcGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		paddingHorizontal: 10,
		justifyContent: 'space-between',
		width: '100%',
	},
	calcButtonWrapper: {
		width: '32%',
		marginVertical: 2,
	},
	calcButtonDouble: {
		width: '49%',
	},

	// ----Upload Image----

	uploadContainer: {
		paddingHorizontal: 5,
		height: 54,
		backgroundColor: colors.gradientMid,
		borderRadius: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		borderWidth: 1,
		borderColor: colors.neutral500,
		borderStyle: 'dashed',
	},
	uploadImage: {
		height: 150,
		width: 150,
		borderRadius: 15,
		borderCurve: 'continuous',
		overflow: 'hidden',
	},
	uploadDeleteIcon: {
		width: 24,
		height: 24,
		borderRadius: 15,
		position: 'absolute',
		top: 6,
		right: 6,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 1,
		shadowRadius: 10,
	},

	// ----Settings----

	settingsItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 15,
		borderBottomWidth: 0.5,
		borderBottomColor: 'rgba(255,255,255,0.05)',
	},
	settingsInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	settingsDaysScroll: {
		gap: 10,
	},
	settingsDayButton: {
		width: 45,
		height: 45,
		backgroundColor: '#171921',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: 'rgba(255,255,255,0.05)',
	},

	// ----Input----

	inputBaseBackground: {
		alignSelf: 'stretch',
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.03)',
		borderRadius: 17,
	},
	inputContainer: {
		flexDirection: 'row',
		height: 54,
		alignItems: 'center',
		gap: 10,
		borderRadius: 17,
	},
	inputContent: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 15,
		gap: 10,
	},
	input: {
		flex: 1,
		color: colors.white,
		fontSize: 14,
		paddingVertical: 0,
	},

	// ----Button----

	button: {
		height: 52,
		width: '100%',
		paddingHorizontal: 16,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 0.8,
		borderColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: 17,
	},
	buttonBack: {
		width: 45,
		height: 45,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 0.8,
		borderColor: 'rgba(255, 255, 255, 0.08)',
		zIndex: 100,
	},

	// ----Tabs----
	tabBar: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'space-around',
		alignItems: 'center',
		backgroundColor: colors.gradientEnd,
		paddingBottom: Platform.OS === 'ios' ? 20 : 60,
		paddingTop: 15,
	},
	tabItem: {
		width: 50,
		height: 50,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	tabActiveItem: {
		borderWidth: 1,
		borderColor: '#1B1B1B',
	},
	tabButton: {
		height: 50,
		width: '100%',
		paddingHorizontal: 16,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 0.8,
		borderRadius: 12,
		borderColor: 'rgba(255, 255, 255, 0.08)',
	},

	// ----Manage Categories----

	rowContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#3e3e3eff',
	},
	rowNameContainer: {
		flex: 1,
	},

	rowActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	rowActionBtn: {
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	rowInput: {
		color: colors.white,
		fontSize: 15,
		borderBottomWidth: 1,
		borderBottomColor: colors.primaryLight || '#fff',
		paddingVertical: 2,
	},

	// ----Confirm Modal----

	confOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.9)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	confModalBox: {
		width: '100%',
		maxWidth: 320,
		backgroundColor: '#161618',
		borderRadius: 24,
		padding: 24,
		borderWidth: 1,
		borderColor: '#242427',
	},

	// ----Privacy----

	title: {
		fontSize: 24,
		fontWeight: '700',
		color: colors.neutral100,
		marginBottom: 6,
	},
	updateDate: {
		fontSize: 13,
		color: colors.neutral400,
		marginBottom: 24,
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: colors.neutral100,
		marginBottom: 8,
	},
	paragraph: {
		fontSize: 14,
		lineHeight: 22,
		color: colors.neutral300,
	},
	bulletPoint: {
		fontSize: 14,
		lineHeight: 22,
		color: colors.neutral300,
		marginLeft: 8,
		marginTop: 4,
	},
	bold: {
		fontWeight: '600',
		color: colors.neutral100,
	},
	actionsContainer: {
		marginTop: 16,
		gap: 12,
		paddingBottom: 24,
	},
});
