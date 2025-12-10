// components/hr/shift/UpdateShiftModal.jsx (updated with employee selector)
"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendar, faClock, faUser } from '@fortawesome/free-solid-svg-icons';

const UpdateShiftModal = ({
    isOpen,
    onClose,
    onAssignShift,
    shiftTypes = [],
    employee = null,
    allEmployees = [] // New prop
}) => {
    const [formData, setFormData] = useState({
        scheduleId: null,
        employeeId: null,
        shiftTypeId: '',
        startDate: '',
        endDate: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (employee && isOpen) {
            const today = new Date().toISOString().split('T')[0];
            setFormData({
                scheduleId: employee.originalScheduleData?.id || null,
                employeeId: employee.employee?.id || null,
                shiftTypeId: employee.shiftTypeId || '',
                startDate: today,
                endDate: today
            });
        }
    }, [employee, isOpen]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.employeeId && !formData.scheduleId) {
            newErrors.employeeId = 'Please select an employee';
        }

        if (!formData.shiftTypeId || formData.shiftTypeId === '') {
            newErrors.shiftTypeId = 'Please select a shift type';
        }

        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        } else if (new Date(formData.startDate) < new Date().toISOString().split('T')[0]) {
            newErrors.startDate = 'Start date cannot be in the past';
        }

        if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
        } else if (new Date(formData.endDate) < new Date(formData.startDate)) {
            newErrors.endDate = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onAssignShift(formData);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShiftTypeChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            shiftTypeId: value
        }));
        
        if (errors.shiftTypeId) {
            setErrors(prev => ({
                ...prev,
                shiftTypeId: ''
            }));
        }
    };

    const handleEmployeeChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            employeeId: value
        }));
        
        if (errors.employeeId) {
            setErrors(prev => ({
                ...prev,
                employeeId: ''
            }));
        }
    };

    if (!isOpen || !employee) return null;

    const selectedEmployee = allEmployees.find(emp => emp.id === formData.employeeId) || employee.employee;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-[#153087] to-[#a67c18] rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {formData.scheduleId ? 'Update Shift' : 'Assign Shift'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {selectedEmployee?.name || 'Select Employee'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            disabled={isSubmitting}
                        >
                            <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Employee Selector for New Assignments */}
                    {!formData.scheduleId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employee <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    value={formData.employeeId || ''}
                                    onChange={handleEmployeeChange}
                                    disabled={isSubmitting}
                                    className={`pl-10 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#153087] focus:border-transparent transition-all duration-200 ${
                                        errors.employeeId 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <option value="">Select employee</option>
                                    {allEmployees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name} ({emp.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.employeeId && (
                                <p className="mt-1 text-sm text-red-600">{errors.employeeId}</p>
                            )}
                        </div>
                    )}

                    {/* Employee Info (Read-only) for Updates */}
                    {formData.scheduleId && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={selectedEmployee?.avatar || '/default-profile.png'}
                                    alt={selectedEmployee?.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {selectedEmployee?.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedEmployee?.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shift Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Shift Type <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={formData.shiftTypeId}
                                onChange={handleShiftTypeChange}
                                disabled={isSubmitting}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#153087] focus:border-transparent transition-all duration-200 ${
                                    errors.shiftTypeId 
                                        ? 'border-red-300 focus:ring-red-500' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <option value="">Select shift type</option>
                                {shiftTypes.map((shiftType) => (
                                    <option key={shiftType.id} value={shiftType.id}>
                                        {shiftType.name} ({shiftType.start_time?.substring(0,5)} - {shiftType.end_time?.substring(0,5)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.shiftTypeId && (
                            <p className="mt-1 text-sm text-red-600">{errors.shiftTypeId}</p>
                        )}
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Range <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faCalendar} className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, startDate: e.target.value }));
                                        if (errors.startDate) setErrors(prev => ({ ...prev, startDate: '' }));
                                    }}
                                    disabled={isSubmitting}
                                    className={`pl-11 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#153087] focus:border-transparent transition-all duration-200 ${
                                        errors.startDate 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                />
                                {errors.startDate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FontAwesomeIcon icon={faCalendar} className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    min={formData.startDate}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, endDate: e.target.value }));
                                        if (errors.endDate) setErrors(prev => ({ ...prev, endDate: '' }));
                                    }}
                                    disabled={isSubmitting}
                                    className={`pl-11 w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#153087] focus:border-transparent transition-all duration-200 ${
                                        errors.endDate 
                                            ? 'border-red-300 focus:ring-red-500' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                />
                                {errors.endDate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#153087] to-[#a67c18] text-white rounded-xl hover:from-[#a67c18] hover:to-[#9b7216] focus:outline-none focus:ring-2 focus:ring-[#153087] font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : formData.scheduleId ? (
                                'Update Shift'
                            ) : (
                                'Assign Shift'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateShiftModal;