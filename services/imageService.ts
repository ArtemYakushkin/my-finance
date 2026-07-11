export const getProfileImage = (file: any) => {
	if (file && typeof file == 'string') return { uri: file };

	if (file && typeof file == 'object' && file.uri) return { uri: file.uri };

	return require('../assets/images/avatar.png');
};
