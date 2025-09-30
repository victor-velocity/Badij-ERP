import React from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function ShiftCard ({ 
    title, 
    count, 
    loading = false, 
    icon, 
    bgColor, 
    textColor 
}) {
    const borderColor = bgColor.replace('-50', '-400');

    return (
        <div className={`flex flex-col px-5 py-7 rounded-xl shadow-lg border-l-4 ${borderColor} ${bgColor} flex-1 min-w-[250px] transition-transform hover:scale-[1.02]`}>
            <div className="flex justify-between items-start w-full">
                <div className='flex flex-col items-start'>
                    <p className="text-sm text-gray-500 font-medium">{title}</p>
                    {loading ? (
                        <div className="h-8 bg-gray-300 rounded w-16 animate-pulse mt-1"></div>
                    ) : (
                        <p className={`text-3xl font-bold mt-1 ${textColor}`}>{count}</p>
                    )}
                </div>
                {icon && (
                    <div className={`p-3 rounded-full ${textColor} ${bgColor.replace('-50', '-100')}`}>
                        <FontAwesomeIcon icon={icon} className="text-2xl" />
                    </div>
                )}
            </div>
        </div>
    );
}