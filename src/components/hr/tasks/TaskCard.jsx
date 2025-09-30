import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TaskCard({ title, count, loading = 0, icon, bgColor = "bg-white", textColor = "text-[#b88b1b]" }) {
    return (
        <div className={`rounded-lg shadow-md py-7 px-5 mb-4 min-w-[200px] flex-grow border-[0.5px] border-solid border-[#DDD9D9] ${bgColor}`}>
            <div className="flex justify-between items-start">
                <h2 className={`text-[15px] font-semibold mb-3 ${textColor}`}>{title}</h2>
                {icon && <FontAwesomeIcon icon={icon} className={`text-2xl ${textColor}`} />}
            </div>
            {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
            ) : (
                <p className={`text-3xl font-bold ${textColor}`}>{count}</p>
            )}
        </div>
    );
}
