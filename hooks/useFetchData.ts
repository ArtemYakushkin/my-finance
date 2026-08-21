import { db } from '@/config/firebase';
import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const useFetchData = <T>(collectionName: string, constraints: QueryConstraint[]) => {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const constraintsKey = JSON.stringify(constraints.map((c) => c.type));

	useEffect(() => {
		if (!collectionName) {
			setLoading(false);
			return;
		}

		setLoading(true);

		const collectionRef = collection(db, collectionName);
		const q = query(collectionRef, ...constraints);

		const unsub = onSnapshot(
			q,
			(snapshot) => {
				const fetchedData = snapshot.docs.map((doc) => {
					return {
						id: doc.id,
						...doc.data(),
					};
				}) as T[];

				setData(fetchedData);
				setError(null);
				setLoading(false);
			},
			(err) => {
				setError(err.message || 'Помилка завантаження даних');
				setLoading(false);
			},
		);

		return () => unsub();
	}, [collectionName, constraintsKey]);

	return { data, loading, error };
};

export default useFetchData;
