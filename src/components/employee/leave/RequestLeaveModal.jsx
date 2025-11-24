"use client";

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const RequestLeaveModal = ({ isOpen, onClose, onSuccess }) => {
    const [leaveType, setLeaveType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    // Today's date (used to block past dates)
    const today = getTodayDate();

    // Reset form when modal opens
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
        else if (name === 'startDate') {
            setStartDate(value);

            // If endDate is now before the new startDate, clear it
            if (endDate && value > endDate) {
                setEndDate('');
            }
        }
        else if (name === 'endDate') setEndDate(value);
        else if (name === 'reason') setReason(value);

        // Clear error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        let errors = {};
        let isValid = true;

        if (!leaveType) {
            errors.leaveType = 'Please select a leave type.';
            isValid = false;
        }

        if (!startDate) {
            errors.startDate = 'Start date is required.';
            isValid = false;
        } else if (startDate < today) {
            errors.startDate = 'Start date cannot be in the past.';
            isValid = false;
        }

        if (!endDate) {
            errors.endDate = 'End date is required.';
            isValid = false;
        } else if (startDate && endDate < startDate) {
            errors.endDate = 'End date cannot be earlier than start date.';
            isValid = false;
        }

        if (!reason.trim()) {
            errors.reason = 'Please provide a reason for your leave.';
            isValid = false;
        } else if (reason.trim().length < 10) {
            errors.reason = 'Reason must be at least 10 characters.';
            isValid = false;
        }

        setValidationErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors below.');
            return;
        }

        setIsSubmitting(true);

        try {
            const leaveRequestData = {
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                reason: reason.trim(),
            };

            const response = await apiService.requestLeave(leaveRequestData);

            if (response && response.status === 'success') {
                toast.success('Leave request submitted successfully!');
                onSuccess?.();
                onClose();
            } else {
                toast.error(response?.message || 'Failed to submit request.');
            }
        } catch (error) {
            console.error('Leave request error:', error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto relative max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-3xl font-light hover:bg-red-50 rounded-full w-10 h-10 flex items-center justify-center transition-all z-10"
                    aria-label="Close"
                >
                    ×
                </button>

                <div className="p-8 pt-12">
                    <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
                        Request Leave
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Leave Type */}
                        <div>
                            <label htmlFor="leaveType" className="block text-sm font-semibold text-gray-700 mb-2">
                                Leave Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="leaveType"
                                name="leaveType"
                                value={leaveType}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] outline-none transition-all ${validationErrors.leaveType ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">-- Select Leave Type --</option>
                                <option value="annual">Annual Leave</option>
                                <option value="sick">Sick Leave</option>
                                <option value="maternity">Maternity Leave</option>
                                <option value="paternity">Paternity Leave</option>
                                <option value="personal">Personal Leave</option>
                                <option value="unpaid">Unpaid Leave</option>
                            </select>
                            {validationErrors.leaveType && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.leaveType}</p>
                            )}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                                Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                name="startDate"
                                value={startDate}
                                onChange={handleChange}
                                min={today}  // Blocks past dates
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] outline-none transition-all ${validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {validationErrors.startDate && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.startDate}</p>
                            )}
                        </div>

                        {/* End Date */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                                End Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                name="endDate"
                                value={endDate}
                                onChange={handleChange}
                                min={startDate || today}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] outline-none transition-all ${validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {validationErrors.endDate && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.endDate}</p>
                            )}
                        </div>

                        {/* Reason */}
                        <div>
                            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                                Reason for Leave <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="reason"
                                name="reason"
                                value={reason}
                                onChange={handleChange}
                                rows="5"
                                placeholder="Please explain why you need this leave..."
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b] outline-none resize-none transition-all ${validationErrors.reason ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                required
                            />
                            {validationErrors.reason && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.reason}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="flex-1 py-3 px-6 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-all disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 px-6 bg-[#b88b1b] hover:bg-[#a07815] text-white font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestLeaveModal;