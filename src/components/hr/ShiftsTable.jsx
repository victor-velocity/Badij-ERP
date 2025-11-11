'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function ShiftManagement({ shifts = [], loading, error }) {
  const router = useRouter();

  const handleSeeAllClick = () => {
    router.push('/humanResources/shift');
  };

  const shiftsToDisplay = shifts.slice(0, 8);

  const formatTime = (time) => {
    if (!time || time === 'N/A') return 'N/A';
    const [h, m] = time.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 my-8">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Shift Management</h2>
        <button
          onClick={handleSeeAllClick}
          className="text-[#A09D9D] text-sm font-medium hover:text-black transition-all cursor-pointer rounded-md px-3 py-1"
        >
          See all
        </button>
      </div>

      <div className="space-y-4" style={{ maxHeight: '540px', overflowY: 'auto' }}>
        {loading ? (
          <div key="loading" className="text-center text-gray-500 p-8">Loading shifts...</div>
        ) : error ? (
          <div key="error" className="text-center text-red-500 p-8">Error: {error}</div>
        ) : shiftsToDisplay.length > 0 ? (
          shiftsToDisplay.map((shift) => (
            <div
              key={shift.id} // unique schedule ID
              className="flex items-center p-3 rounded-lg border border-gray-100"
            >
              <img
                src={shift.employee.avatar || 'https://placehold.co/100x100/A09D9D/ffffff?text=?'}
                alt={shift.employee.name}
                className="w-12 h-12 rounded-full mr-4 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/100x100/A09D9D/ffffff?text=?';
                }}
              />
              <div>
                <p className="font-semibold text-gray-800">
                  {shift.employee.name} - {shift.shiftType}
                </p>
                <p className="text-sm text-gray-600">{shift.department}</p>
                <p className="text-xs text-gray-500">
                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div key="empty" className="text-center text-gray-500 p-8">
            No shifts scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
}