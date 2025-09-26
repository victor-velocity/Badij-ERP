// components/inventory/management/InventoryCard.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const InventoryCard = ({ title, value, borderColor, textColor, icon, loading = false }) => {
    return (
        <div className={`bg-white rounded-lg shadow-sm p-6 ${borderColor} hover:shadow-md transition-shadow duration-200`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    {loading ? (
                        <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                    )}
                </div>
                <div className={`p-3 rounded-full ${textColor} bg-opacity-10`}>
                    <FontAwesomeIcon icon={icon} className="text-xl" />
                </div>
            </div>
            {loading && (
                <div className="mt-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
            )}
        </div>
    );
};