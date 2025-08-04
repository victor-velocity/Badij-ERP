import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function TaskCard({ title, value, icon, iconColor }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col justify-between h-[120px] w-full border border-gray-200">
      <h3 className="text-gray-600 text-base font-medium mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        {icon && <FontAwesomeIcon icon={icon} className={`text-3xl ${iconColor}`} />}
      </div>
    </div>
  );
}