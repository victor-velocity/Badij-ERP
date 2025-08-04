import React from 'react';
import { faCheckCircle, faExclamationCircle, faTimesCircle, faCalendarTimes } from '@fortawesome/free-solid-svg-icons';

const getStatusStyles = (status) => {
  switch (status) {
    case 'Present':
      return { text: 'text-green-600', icon: faCheckCircle };
    case 'Late':
      return { text: 'text-yellow-600', icon: faExclamationCircle };
    case 'Absent':
      return { text: 'text-red-600', icon: faTimesCircle };
    case 'Weekend':
      return { text: 'text-gray-500', icon: faCalendarTimes };
    default:
      return { text: 'text-gray-500', icon: null };
  }
};

const AttendanceTable = ({ data }) => {
  return (
    <div className="rounded-xl shadow-md overflow-hidden border border-solid border-[#DDD9D9]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Day</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Clock in</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Clock out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Hours worked</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => {
              const { text } = getStatusStyles(row.status);
              return (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{row.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{row.day}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{row.clockIn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{row.clockOut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{row.hoursWorked}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${text}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{row.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;