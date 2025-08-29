import React from "react";

export const StockMovementCard = ({ title, value }) => (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500 mb-2 pb-3">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold">{value}</p>
    </div>
);