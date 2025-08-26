"use client";

import React from "react";

export const StatCard = ({ title, count, color, icon }) => {
    const colorVariants = {
        blue: 'bg-blue-100 text-blue-800',
        green: 'bg-green-100 text-green-800',
        orange: 'bg-orange-100 text-orange-800',
        purple: 'bg-purple-100 text-purple-800',
        red: 'bg-red-100 text-red-800'
    };

    const borderVariants = {
        blue: 'border-2 border-solid border-blue-100',
        green: 'border-2 border-solid border-green-100',
        orange: 'border-2 border-solid border-orange-100',
        purple: 'border-2 border-solid border-purple-100',
        red: 'border-2 border-solid border-red-100'
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm p-6 flex flex-col justify-between h-full ${borderVariants[color]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    <h3 className="text-2xl font-bold mt-1">{count}</h3>
                </div>
                <div className={`rounded-lg p-3 ${colorVariants[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};
