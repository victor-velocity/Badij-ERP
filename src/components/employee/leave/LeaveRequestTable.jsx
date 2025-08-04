// components/employee/leave/LeaveRequestTable.jsx
"use client"
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import DeleteConfirmationModal from './DeleteConfirmationModal';

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

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '—';
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
};

export const LeaveRow = ({ leaveRequest, onDeleteRequest }) => {
    const [currentLeaveStatus, setCurrentLeaveStatus] = useState(leaveRequest.status);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    
    const isApproved = currentLeaveStatus.toLowerCase() === 'approved';

    useEffect(() => {
        setCurrentLeaveStatus(leaveRequest.status);
    }, [leaveRequest.status]);

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'declined':
                return 'bg-red-100 text-red-800';
            case 'cancelled':
                return 'bg-gray-200 text-gray-700';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        setIsCancelling(true);
        try {
            await apiService.updateLeave(leaveRequest.id, { status: 'cancelled' });
            toast.success('Leave request cancelled successfully!');
            setCurrentLeaveStatus('cancelled');
            if (onDeleteRequest) {
                onDeleteRequest(leaveRequest.id);
            }
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error cancelling leave request:', error);
            toast.error(`Failed to cancel leave request: ${error.message || 'An unexpected error occurred.'}`);
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <tr className="hover:bg-gray-50 rounded-lg">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {leaveRequest.leave_type || "N/A"}
                </div>
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
                <span
                    className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(currentLeaveStatus)}`}
                >
                    {currentLeaveStatus.charAt(0).toUpperCase() + currentLeaveStatus.slice(1)}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                {leaveRequest.approver?.first_name} {leaveRequest.approver?.last_name || "N/A"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(leaveRequest.created_at)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium rounded-r-lg">
                <button
                    onClick={handleDeleteClick}
                    className={`text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isApproved ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isApproved ? "Approved leave requests cannot be deleted" : "Cancel Leave Request"}
                    disabled={isApproved || isCancelling}
                >
                    <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                </button>
            </td>
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isLoading={isCancelling}
            />
        </tr>
    );
};