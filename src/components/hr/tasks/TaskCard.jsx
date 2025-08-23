import React from "react";

export default function TaskCard({ title, count, loading = 0 }) {
    return (
        <div className="bg-white rounded-lg shadow-md py-3 px-4 mb-4 min-w-[200px] flex-grow border-[0.5px] border-solid border-[#DDD9D9]">
            <h2 className="text-[16px] font-bold text-[#A09D9D] mb-3">{title}</h2>
            {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            ) : (
                <p className="text-3xl font-bold text-[#b88b1b]">{count}</p>
            )}
        </div>
    );
}