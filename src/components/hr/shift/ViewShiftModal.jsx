"use client";

import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const ViewShiftModal = ({ isOpen, onClose, shift }) => {
    if (!isOpen || !shift) return null;

    const formatTimeWithAmPm = (timeString) => {
        if (!timeString || timeString === 'N/A' || timeString.includes('undefined')) return 'N/A';
        try {
            const [hours, minutes] = timeString.split(':');
            const hourNum = parseInt(hours, 10);
            
            // Check if hours is a valid number
            if (isNaN(hourNum)) return 'N/A';
            
            const period = hourNum >= 12 ? 'PM' : 'AM';
            const displayHour = hourNum % 12 || 12;
            return `${displayHour}:${minutes || '00'} ${period}`;
        } catch {
            return 'N/A';
        }
    };

    const renderBadge = (shiftType) => {
        let bgColorClass = '';
        let textColorClass = '';
        let borderColorClass = 'border-2';

        switch (shiftType) {
            case 'Morning':
                bgColorClass = 'bg-green-50';
                textColorClass = 'text-green-700';
                borderColorClass += ' border-green-300';
                break;
            case 'Afternoon':
                bgColorClass = 'bg-yellow-50';
                textColorClass = 'text-yellow-700';
                borderColorClass += ' border-yellow-300';
                break;
            case 'Night':
                bgColorClass = 'bg-blue-50';
                textColorClass = 'text-blue-700';
                borderColorClass += ' border-blue-300';
                break;
            case 'Unassigned':
            default:
                bgColorClass = 'bg-gray-50';
                textColorClass = 'text-gray-700';
                borderColorClass += ' border-gray-300';
        }

        return (
            <span
                className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${bgColorClass} ${textColorClass} ${borderColorClass}`}
            >
                {shiftType}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl p-6 relative transform transition-all scale-100 ease-in-out duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    aria-label="Close modal"
                >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                </button>

                <div className="flex flex-col items-center border-b pb-4 mb-4">
                    <div className="flex-shrink-0 h-20 w-20 mb-2">
                        <Image
                            className="h-full w-full rounded-full object-cover border-4 border-gray-200"
                            src={shift.employee?.avatar || '/default-profile.png'}
                            alt={shift.employee?.name || 'Employee'}
                            width={96}
                            height={96}
                        />
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">{shift.employee?.name || 'N/A'}</h2>
                        <p className="text-sm text-gray-500">{shift.employee?.email || 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="">
                        <p className="text-sm font-semibold text-[#b88b1b] uppercase mb-2 ml-2">Shift Type</p>
                        {renderBadge(shift.shiftType || 'Unassigned')}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        <div>
                            <p className="text-sm font-semibold text-[#b88b1b] uppercase">Department</p>
                            <p className="text-lg text-gray-900 font-medium mt-1">{shift.department || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#b88b1b] uppercase">Date</p>
                            <p className="text-lg text-gray-900 font-medium mt-1">{shift.date || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#b88b1b] uppercase">Start Time</p>
                            <p className="text-lg text-gray-900 font-medium mt-1">
                                {formatTimeWithAmPm(shift.startTime)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#b88b1b] uppercase">End Time</p>
                            <p className="text-lg text-gray-900 font-medium mt-1">
                                {formatTimeWithAmPm(shift.endTime)}
                            </p>
                        </div>
                    </div>

                    {shift.note && (
                        <div>
                            <p className="text-sm font-semibold text-[#b88b1b] uppercase">Note</p>
                            <p className="text-lg text-gray-900 mt-1">{shift.note}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-8">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center rounded-md border border-transparent bg-[#b88b1b] px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a67c18] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewShiftModal;