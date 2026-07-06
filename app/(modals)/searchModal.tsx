import BackButton from '@/components/BackButton';
import Header from '@/components/Header';
import Input from '@/components/Input';
import ModalWrapper from '@/components/ModalWrapper';
import { globalStyles } from '@/constants/global';
import { ScrollView, View } from 'react-native';

const searchModal = () => {
	return (
		<ModalWrapper>
			<View
				style={[
					globalStyles.container,
					{ justifyContent: 'space-between' },
				]}
			>
				<Header title={'Пошук'} leftIcon={<BackButton />} />

				<ScrollView
					contentContainerStyle={globalStyles.modalForm}
					showsVerticalScrollIndicator={false}
				>
					<View style={{ gap: 10, paddingHorizontal: 5 }}>
						<Input
							placeholder="Знайти транзакцію..."
							// value={search}
							// onChangeText={(value) => setSearch(value)}
						/>
					</View>

					{/* <View>
						<TransactionList
							data={filteredTransactions}
							loading={transactionsLoading}
							filterByMonth={false}
							emptyListMessage="Немає транзакцій, що відповідають вашим ключовим словам пошуку"
						/>
					</View> */}
				</ScrollView>
			</View>
		</ModalWrapper>
	);
};

export default searchModal;
