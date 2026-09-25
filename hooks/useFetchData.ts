import { db } from '@/config/firebase';
import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const useFetchData = <T>(collectionName: string, constraints: QueryConstraint[] = []) => {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	// Сериализуем все ограничения, чтобы реагировать на смену параметров
	const constraintsKey = JSON.stringify(constraints);

	useEffect(() => {
		if (!collectionName) {
			setLoading(false);
			return;
		}

		setLoading(true);

		const collectionRef = collection(db, collectionName);
		const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef;

		const unsub = onSnapshot(
			q,
			// includeMetadataChanges гарантирует получение локальных изменений до синхронизации с сервером
			{ includeMetadataChanges: true },
			(snapshot) => {
				const fetchedData = snapshot.docs.map((doc) => {
					const docData = doc.data();
					return {
						id: doc.id,
						...docData,
						// Если созданный timestamp еще на сервере (pending), даем текущую дату для корректной сортировки
						created: docData.created?.toDate ? docData.created.toDate() : new Date(),
					};
				}) as T[];

				setData(fetchedData);
				setError(null);
				setLoading(false);
			},
			(err) => {
				console.error(`Error fetching ${collectionName}:`, err);
				setError(err.message || 'Помилка завантаження даних');
				setLoading(false);
			},
		);

		return () => unsub();
	}, [collectionName, constraintsKey]);

	return { data, loading, error };
};

export default useFetchData;
