import { db } from '@/config/firebase'; // Изменили firestore на db, как в остальных ваших файлах
import {
	collection,
	onSnapshot,
	query,
	QueryConstraint,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

const useFetchData = <T>(
	collectionName: string,
	constraints: QueryConstraint[],
) => {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Сериализуем ограничения в строку, чтобы useEffect мог сравнивать их примитивно,
	// а не по ссылке на массив. Это предотвратит бесконечный цикл рендеров.
	const constraintsKey = JSON.stringify(constraints.map((c) => c.type));

	useEffect(() => {
		if (!collectionName) {
			setLoading(false);
			return;
		}

		setLoading(true); // Включаем лоадер при изменении параметров запроса

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
				setError(null); // Сбрасываем ошибку, если данные пришли успешно
				setLoading(false);
			},
			(err) => {
				console.error(
					`Помилка завантаження колекції ${collectionName}:`,
					err,
				);
				setError(err.message);
				setLoading(false);
			},
		);

		// Отписываемся от старого слушателя при размонтировании или смене фильтров
		return () => unsub();

		// Теперь хук перезапустится только тогда, когда реально изменится имя коллекции
		// или структура фильтров/сортировки
	}, [collectionName, constraintsKey]);

	return { data, loading, error };
};

export default useFetchData;
