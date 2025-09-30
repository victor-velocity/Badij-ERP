import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function PayrollCard({ title, value, icon, color }) {
    const iconBgClass = color === 'orange' 
        ? 'bg-[#FDEDC5]' 
        : color === 'green' 
        ? 'bg-green-100'
        : color === 'red'
        ? 'bg-red-100'
        : 'bg-gray-100';
    
    const iconColorClass = color === 'orange' 
        ? 'text-[#b88b1b]'
        : color === 'green' 
        ? 'text-green-600'
        : color === 'red'
        ? 'text-red-600'
        : 'text-gray-600';

    return (
        <div className="px-4 py-5 border-[0.5px] border-solid border-[#DDD9D9] hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 rounded-xl hover:bg-[#b88b1b] min-w-[240px] flex-grow group">
            <div className="flex justify-between items-start mb-3">
                <h5 className="text-[#A09D9D] text-[16px] font-bold group-hover:text-white">{title}</h5>
                {icon && (
                    <div className={`p-2 rounded-full ${iconBgClass}`}>
                        <FontAwesomeIcon icon={icon} className={`h-5 w-5 ${iconColorClass}`} />
                    </div>
                )}
            </div>
            <p className="text-black/80 font-bold text-3xl group-hover:text-white">{value}</p>
        </div>
    )
}