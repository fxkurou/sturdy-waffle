'use client';
import { useState } from 'react';

interface CatalogItem {
    id: number;
    name: string;
}


export default function CatalogButton() {
    const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCatalogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://frontend-study.xenn.xyz/catalog?collection=notebooks');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            if (data && data.products) {
                setCatalogs(data.products);
            } else {
                setCatalogs([]);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <button onClick={fetchCatalogs} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Fetch Catalogs'}
            </button>
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {catalogs.length > 0 ? (
                <ul>
                    {catalogs.map((catalog, index) => (
                        <li key={catalog.id || index}>{catalog.name}</li>
                    ))}
                </ul>
            ) : (
                !isLoading && <p>No catalogs found.</p>
            )}
        </div>
    );
}