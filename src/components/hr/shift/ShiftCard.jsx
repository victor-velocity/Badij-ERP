import React from "react";

export default function ShiftCard ({ title, count, loading = false }) {
    return (
        <div className="bg-white rounded-lg shadow-md py-5 px-4 mb-4 min-w-[250px] flex-grow border-[0.5px] border-solid border-[#DDD9D9]">
            <h3 className="text-lg font-semibold text-[#b88b1b] mb-2">{title}</h3>
            {loading ? (
                <div className="h-8 bg-gray-300 rounded w-16 animate-pulse"></div>
            ) : (
                <p className="text-3xl font-bold text-gray-700">{count}</p>
            )}
        </div>
    );
};