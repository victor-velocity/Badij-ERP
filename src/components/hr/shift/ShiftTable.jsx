"use client";

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit } from '@fortawesome/free-solid-svg-icons';

const ShiftTable = ({ shifts = [], onViewShift, onOpenUpdateShiftModal, loading, error }) => {
    const calculateHours = (startTime, endTime) => {
        if (!startTime || !endTime || startTime === 'N/A' || endTime === 'N/A') {
            return 'N/A';
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        let startInMinutes = startHour * 60 + startMinute;
        let endInMinutes = endHour * 60 + endMinute;

        if (endInMinutes < startInMinutes) {
            endInMinutes += 24 * 60;
        }

        const durationInMinutes = endInMinutes - startInMinutes;
        const hours = Math.floor(durationInMinutes / 60);
        const minutes = durationInMinutes % 60;

        return `${hours}h ${minutes}m`;
    };

    const calculateTotalMinutes = (shift) => {
        const startTime = shift.startTime;
        const endTime = shift.endTime;
        if (!startTime || !endTime || startTime === 'N/A' || endTime === 'N/A') {
            return -1;
        }

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        let startInMinutes = startHour * 60 + startMinute;
        let endInMinutes = endHour * 60 + endMinute;

        if (endInMinutes < startInMinutes) {
            endInMinutes += 24 * 60;
        }
        return endInMinutes - startInMinutes;
    };

    const formatTimeWithAmPm = (timeString) => {
        if (!timeString || timeString === 'N/A') return 'N/A';
        
        const [hours, minutes] = timeString.split(':');
        const hourNum = parseInt(hours, 10);
        
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        
        return `${displayHour}:${minutes} ${period}`;
    };

    const getShiftTypeColorClasses = (shiftType) => {
        if (shiftType) {
            const normalizedShiftType = shiftType.toLowerCase();
            switch (normalizedShiftType) {
                case 'morning':
                    return 'pr-3 border-green-300 bg-green-50 text-green-700';
                case 'afternoon':
                    return 'pr-3 border-yellow-300 bg-yellow-50 text-yellow-700';
                case 'night':
                    return 'pr-3 border-blue-300 bg-blue-50 text-blue-700';
                case 'unassigned':
                    return 'pr-3 border-gray-300 bg-gray-50 text-gray-700';
                default:
                    return 'pr-3 border-gray-300 bg-gray-50 text-gray-700';
            }
        }
        return 'pr-3 border-gray-300 bg-gray-50 text-gray-700';
    };

    // Sort shifts in descending order based on number of hours
    const sortedShifts = [...shifts].sort((a, b) => {
        const hoursA = calculateTotalMinutes(a);
        const hoursB = calculateTotalMinutes(b);
        return hoursB - hoursA;
    });

    // Loading skeleton component
    const LoadingSkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="ml-4">
                        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-32"></div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-6 bg-gray-300 rounded-full w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-8 bg-gray-300 rounded w-16"></div>
            </td>
        </tr>
    );

    if (error) {
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Hours</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                            <td colSpan="6" className="px-6 py-8 text-center">
                                <div className="text-red-500 font-medium">{error}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. of Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, index) => (
                            <LoadingSkeletonRow key={index} />
                        ))
                    ) : !sortedShifts || sortedShifts.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                No shifts found
                            </td>
                        </tr>
                    ) : (
                        sortedShifts.map((shift) => {
                            const startTimeFormatted = formatTimeWithAmPm(shift.startTime);
                            const endTimeFormatted = formatTimeWithAmPm(shift.endTime);
                            const timeDisplay = shift.startTime && shift.endTime 
                                ? `${startTimeFormatted} - ${endTimeFormatted}` 
                                : 'N/A';
                            
                            const shiftTypeClass = getShiftTypeColorClasses(shift.shiftType);
                            const numberOfHours = calculateHours(shift.startTime, shift.endTime);

                            return (
                                <tr key={shift.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img 
                                                    className="h-10 w-10 rounded-full" 
                                                    src={shift.employee?.avatar || '/default-profile.png'} 
                                                    alt={shift.employee?.name || 'Employee'} 
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {shift.employee?.name || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {shift.employee?.email || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {shift.department || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium border ${shiftTypeClass}`}>
                                            {shift.shiftType || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {timeDisplay}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {numberOfHours}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2 ml-3">
                                            <button
                                                onClick={() => onViewShift(shift)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            <button
                                                onClick={() => onOpenUpdateShiftModal(shift)}
                                                className="text-green-600 hover:text-green-900"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ShiftTable;