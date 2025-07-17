// components/hr/shift/ViewShiftModal.js
"use client";

import React from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const ViewShiftModal = ({ isOpen, onClose, shift }) => {
    if (!isOpen || !shift) return null;

    const renderBadge = (shiftType) => {
        let bgColorClass = '';
        let textColorClass = '';

        switch (shiftType) {
            case 'Morning':
                bgColorClass = 'bg-blue-100';
                textColorClass = 'text-blue-800';
                break;
            case 'Evening':
                bgColorClass = 'bg-purple-100';
                textColorClass = 'text-purple-800';
                break;
            case 'Night':
                bgColorClass = 'bg-indigo-100';
                textColorClass = 'text-indigo-800';
                break;
            // Add more shift types as needed
            default:
                bgColorClass = 'bg-gray-100';
                textColorClass = 'text-gray-800';
        }

        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColorClass} ${textColorClass}`}
            >
                {shiftType}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                </button>
                {/* Changed title to reflect shift details */}
                <h2 className="text-2xl font-bold mb-6">Shift Details: {shift.shiftType} Shift</h2>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Employee:</p>
                        <div className="flex items-center mt-1">
                            <Image
                                className="h-8 w-8 rounded-full object-cover mr-2"
                                src={shift.employee.avatar || '/default-profile.png'} // Use dynamic avatar
                                alt={shift.employee.name}
                                width={32}
                                height={32}
                            />
                            <p className="text-base text-gray-900">{shift.employee.name} ({shift.employee.email})</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">Department:</p>
                        <p className="text-base text-gray-900">{shift.department}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">Shift Type:</p>
                        {renderBadge(shift.shiftType)} {/* Use renderBadge for shiftType */}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Date:</p>
                            <p className="text-base text-gray-900">{shift.date}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">Start Time:</p>
                            <p className="text-base text-gray-900">{shift.startTime}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">End Time:</p>
                        <p className="text-base text-gray-900">{shift.endTime}</p>
                    </div>

                    {shift.note && ( // Display note only if it exists
                        <div>
                            <p className="text-sm font-medium text-gray-700">Note:</p>
                            <p className="text-base text-gray-900">{shift.note}</p>
                        </div>
                    )}

                </div>

                <div className="flex justify-end mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-transparent bg-[#b88b1b] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewShiftModal;