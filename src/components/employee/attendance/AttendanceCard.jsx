import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AttendanceCard = ({ label, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md px-4 py-7 min-w-[220px] flex-grow flex items-center justify-between transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-col">
        <span className="text-gray-500 text-sm font-medium">{label}</span>
        <span className="text-2xl font-bold mt-1 text-gray-800">{value}</span>
      </div>
      <div className={`p-3 rounded-full bg-gray-100 ${color}`}>
        <FontAwesomeIcon icon={icon} className="h-6 w-6" />
      </div>
    </div>
  );
};

export default AttendanceCard;