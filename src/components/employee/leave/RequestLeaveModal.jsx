"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';

const RequestLeaveModal = ({ isOpen, onClose, onSuccess }) => {
    const [leaveType, setLeaveType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setLeaveType('');
        setStartDate('');
        setEndDate('');
        setReason('');
        setValidationErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'leaveType') setLeaveType(value);
        else if (name === 'startDate') setStartDate(value);
        else if (name === 'endDate') setEndDate(value);
        else if (name === 'reason') setReason(value);

        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        let errors = {};
        let isValid = true;

        if (!leaveType) {
            errors.leaveType = 'Leave type is required.';
            isValid = false;
        }
        if (!startDate) {
            errors.startDate = 'Start date is required.';
            isValid = false;
        }
        if (!endDate) {
            errors.endDate = 'End date is required.';
            isValid = false;
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            errors.endDate = 'End date cannot be before start date.';
            isValid = false;
        }
        if (!reason.trim()) {
            errors.reason = 'Reason is required.';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please correct the errors in the form.');
            return;
        }

        setIsSubmitting(true);
        try {
            const leaveRequestData = {
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason,
            };

            const response = await apiService.requestLeave(leaveRequestData);

            if (response) {
                toast.success('Leave request submitted successfully!');
                onSuccess();
                onClose();
            } else {
                toast.error('Failed to submit leave request.');
            }
        } catch (error) {
            console.error('Error submitting leave request:', error);
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50 font-sans">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg mx-4 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-2xl font-bold rounded-full p-1 transition-colors"
                    aria-label="Close modal"
                >
                    &times;
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Request Leave</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
                            Leave Type
                        </label>
                        <select
                            id="leaveType"
                            name="leaveType"
                            value={leaveType}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none ${
                                validationErrors.leaveType ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        >
                            <option value="">Select Leave Type</option>
                            <option value="maternity">Maternity Leave</option>
                            <option value="paternity">Paternity Leave</option>
                            <option value="annual">Annual Leave</option>
                            <option value="sick">Sick Leave</option>
                            <option value="personal">Personal Leave</option>
                            <option value="unpaid">Unpaid Leave</option>
                        </select>
                        {validationErrors.leaveType && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.leaveType}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={startDate}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none ${
                                validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                        />
                        {validationErrors.startDate && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={endDate}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none ${
                                validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            min={startDate}
                            required
                        />
                        {validationErrors.endDate && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.endDate}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Reason
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            value={reason}
                            onChange={handleChange}
                            rows="4"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#b88b1b] outline-none resize-none ${
                                validationErrors.reason ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Briefly describe the reason for your leave..."
                            required
                        ></textarea>
                        {validationErrors.reason && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.reason}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-md bg-[#b88b1b] text-white font-medium hover:bg-[#a07a16] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestLeaveModal;
