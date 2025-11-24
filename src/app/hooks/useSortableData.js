// hooks/useSortableData.js
import { useState, useMemo } from 'react';

export const useSortableData = (items, config = { key: 'created_at', direction: 'desc' }) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key.includes('date') || sortConfig.key.includes('created') || sortConfig.key.includes('updated')) {
                    aValue = new Date(aValue);
                    bValue = new Date(bValue);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};