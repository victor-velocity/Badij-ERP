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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};

export const LeaveRow = ({ leaveRequest, onUpdateStatus }) => {
    const [imgSrc, setImgSrc] = useState(DEFAULT_AVATAR);
    const [currentLeaveStatus, setCurrentLeaveStatus] = useState(leaveRequest.status);
    const [isUpdating, setIsUpdating] = useState(false);

    const isStatusLocked = ['approved', 'rejected'].includes(currentLeaveStatus.toLowerCase());

    useEffect(() => {
        setCurrentLeaveStatus(leaveRequest.status);
    }, [leaveRequest.status]);

    const handleImageError = () => {
        setImgSrc(DEFAULT_AVATAR);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getBalanceColor = (balance) => {
        if (balance === null || balance === undefined) return 'bg-gray-100 text-gray-600';
        if (balance <= 5) return 'bg-red-100 text-red-800';
        if (balance <= 10) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    };

    const handleDropdownChange = async (e) => {
        const newStatus = e.target.value.toLowerCase();
        setCurrentLeaveStatus(newStatus);
        setIsUpdating(true);

        try {
            await apiService.updateLeave(leaveRequest.id, { status: newStatus });
            toast.success(`Leave request ${newStatus}!`);
            onUpdateStatus?.(leaveRequest.id, newStatus);
        } catch (error) {
            toast.error("Failed to update status");
            setCurrentLeaveStatus(leaveRequest.status);
        } finally {
            setIsUpdating(false);
        }
    };

    const employee = leaveRequest.employee;
    const leaveBalance = employee?.leave_balance ?? 0;

    return (
        <tr className="hover:bg-gray-50 transition-colors">
            {/* Name + Avatar */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                        <img
                            className="h-10 w-10 rounded-full object-cover border"
                            src={employee?.avatar_url || imgSrc}
                            alt=""
                            onError={handleImageError}
                        />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                            {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{employee?.email || '—'}</div>
                    </div>
                </div>
            </td>

            {/* Leave Type */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {leaveRequest.leave_type || "—"}
            </td>

            {/* Reason */}
            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={leaveRequest.reason}>
                {leaveRequest.reason || "—"}
            </td>

            {/* Start Date */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(leaveRequest.start_date)}
            </td>

            {/* End Date */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(leaveRequest.end_date)}
            </td>

            {/* Leave Days */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {calculateLeaveDuration(leaveRequest.start_date, leaveRequest.end_date)}
            </td>

            {/* Leave Balance - NEW COLUMN */}
            <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getBalanceColor(leaveBalance)}`}>
                    {leaveBalance} {leaveBalance === 1 ? 'day' : 'days'}
                </span>
            </td>

            {/* Approval Status */}
            <td className="px-6 py-4 whitespace-nowrap">
                <select
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border-0 ${getStatusColor(currentLeaveStatus)} 
                               ${isStatusLocked || isUpdating ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} 
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    value={currentLeaveStatus}
                    onChange={handleDropdownChange}
                    disabled={isStatusLocked || isUpdating}
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approve</option>
                    <option value="rejected">Decline</option>
                </select>
                {isUpdating && <span className="ml-2 text-xs text-gray-500">Updating...</span>}
            </td>

            {/* Approved By */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {leaveRequest.approver 
                    ? `${leaveRequest.approver.first_name} ${leaveRequest.approver.last_name}`
                    : "—"
                }
            </td>

            {/* Request Date */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(leaveRequest.created_at)}
            </td>
        </tr>
    );
};