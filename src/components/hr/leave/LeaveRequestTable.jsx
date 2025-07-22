"use client"
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';

const DEFAULT_AVATAR = 'https://placehold.co/40x40/E0E0E0/333333?text=User';

const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options).replace(/(\w+) (\d+), (\d+)/, '$2 of $1 $3');
};

const calculateLeaveDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '—';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};

export const LeaveRow = ({ leaveRequest, onUpdateStatus }) => {
    const [imgSrc, setImgSrc] = useState(DEFAULT_AVATAR);
    const [currentLeaveStatus, setCurrentLeaveStatus] = useState(leaveRequest.status);

    const isStatusLocked = currentLeaveStatus.toLowerCase() === 'approved' || currentLeaveStatus.toLowerCase() === 'declined';

    useEffect(() => {
        setCurrentLeaveStatus(leaveRequest.status);
    }, [leaveRequest.status]);

    const handleImageError = () => {
        setImgSrc(DEFAULT_AVATAR);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'declined':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDropdownChange = async (e) => {
        const newStatus = e.target.value.toLowerCase();
        setCurrentLeaveStatus(newStatus);

        try {
            const updatedLeaveData = {
                status: newStatus,
            };

            await apiService.updateLeave(leaveRequest.id, updatedLeaveData);

            toast.success(`Leave request for ${leaveRequest.employee.first_name} updated to ${newStatus}!`);
            if (onUpdateStatus) {
                onUpdateStatus(leaveRequest.id, newStatus);
            }
        } catch (error) {
            console.error('Error updating leave status:', error);
            toast.error(`Failed to update leave status: ${error.message || 'An unexpected error occurred.'}`);
            setCurrentLeaveStatus(leaveRequest.status);
        }
    };

    return (
        <tr className="hover:bg-gray-50 rounded-lg">
            <td className="px-6 py-4 whitespace-nowrap rounded-l-lg">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                        <img
                            className="h-full w-full object-cover rounded-full"
                            src={imgSrc}
                            alt={`${leaveRequest.employee.first_name}'s avatar`}
                            onError={handleImageError}
                        />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{`${leaveRequest.employee.first_name} ${leaveRequest.employee.last_name}`}</div>
                        <div className="text-sm text-gray-500">{leaveRequest.employee.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {leaveRequest.leave_type || "N/A"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {leaveRequest.reason || "N/A"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(leaveRequest.start_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(leaveRequest.end_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {calculateLeaveDuration(leaveRequest.start_date, leaveRequest.end_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(currentLeaveStatus)} ${isStatusLocked ? 'opacity-70 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    value={currentLeaveStatus}
                    onChange={handleDropdownChange}
                    disabled={isStatusLocked}
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                {leaveRequest.approver.first_name } {leaveRequest.approver.last_name || "Not Approved"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 rounded-r-lg">
                {formatDate(leaveRequest.created_at)}
            </td>
        </tr>
    );
};
