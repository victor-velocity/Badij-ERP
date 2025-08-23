"use client";

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const UpdateTaskModal = ({ show, task, onSave, onCancel }) => {
    const router = useRouter();
    const dropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        assigned_to: [],
        id: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    useEffect(() => {
        if (show && task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                start_date: formatDateForInput(task.start_date),
                end_date: formatDateForInput(task.end_date),
                assigned_to: task.assignedEmployees?.map(emp => emp.id) || [],
                id: task.id,
            });

            // Set selected employees for display
            setSelectedEmployees(task.assignedEmployees || []);
            setEmployeeSearchTerm('');
        }
    }, [show, task]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const fetchedEmployees = await apiService.getEmployees(router);
                setAllEmployees(fetchedEmployees);
                setFilteredEmployees(fetchedEmployees);
            } catch (err) {
                console.error("Failed to fetch employees:", err);
                toast.error("Failed to load employees for assignment.");
            }
        };

        if (show) {
            fetchEmployees();
        }
    }, [show, router]);

    useEffect(() => {
        const lowercasedSearchTerm = employeeSearchTerm.toLowerCase();
        const filtered = allEmployees.filter(emp =>
            (emp.first_name?.toLowerCase().includes(lowercasedSearchTerm) ||
                emp.last_name?.toLowerCase().includes(lowercasedSearchTerm) ||
                emp.email?.toLowerCase().includes(lowercasedSearchTerm)) &&
            !formData.assigned_to.includes(emp.id)
        );
        setFilteredEmployees(filtered);
    }, [employeeSearchTerm, allEmployees, formData.assigned_to]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmployeeSearchChange = (e) => {
        setEmployeeSearchTerm(e.target.value);
        setDropdownOpen(true);
    };

    const handleEmployeeSelect = (employee) => {
        if (!formData.assigned_to.includes(employee.id)) {
            setFormData(prev => ({
                ...prev,
                assigned_to: [...prev.assigned_to, employee.id]
            }));
            setSelectedEmployees(prev => [...prev, employee]);
        }
        setEmployeeSearchTerm('');
        setDropdownOpen(false);
    };

    const handleRemoveEmployee = (employeeId) => {
        setFormData(prev => ({
            ...prev,
            assigned_to: prev.assigned_to.filter(id => id !== employeeId)
        }));
        setSelectedEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const updatedTaskPayload = {
                id: formData.id,
                title: formData.title,
                description: formData.description,
                start_date: formData.start_date,
                end_date: formData.end_date,
                assigned_to: formData.assigned_to, // This should be an array of employee IDs
                status: task.status,
                created_by: task.created_by,
            };
            
            await onSave(updatedTaskPayload);
            onCancel();
        } catch (error) {
            console.error("Error saving task:", error);
            toast.error("Failed to update task. Try again");
        } finally {
            setIsSaving(false);
        }
    };

    if (!show) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#000000aa] flex items-center justify-center">
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-y-scroll shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh]">
                <form onSubmit={handleSubmit}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    Update Task
                                </h3>
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Task Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            id="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 border"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            name="description"
                                            id="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="3"
                                            className="mt-1 block w-full rounded-md border-gray-300 resize-none focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 border"
                                        ></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                                            <input
                                                type="date"
                                                name="start_date"
                                                id="start_date"
                                                value={formData.start_date}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 border"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                                            <input
                                                type="date"
                                                name="end_date"
                                                id="end_date"
                                                value={formData.end_date}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 border"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4 relative" ref={dropdownRef}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Assign to
                                        </label>

                                        {selectedEmployees.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {selectedEmployees.map(employee => (
                                                    <div key={employee.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                                                        <span className="text-sm">
                                                            {employee.first_name} {employee.last_name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveEmployee(employee.id)}
                                                            className="ml-2 text-gray-500 hover:text-red-500"
                                                            disabled={isSaving}
                                                        >
                                                            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="block w-full rounded-md border border-gray-300 focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 pr-10"
                                                placeholder="Search and select employees"
                                                value={employeeSearchTerm}
                                                onChange={handleEmployeeSearchChange}
                                                onFocus={() => setDropdownOpen(true)}
                                                disabled={isSaving}
                                                autoComplete="off"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </div>

                                        {dropdownOpen && (
                                            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                                                {filteredEmployees.length > 0 ? (
                                                    filteredEmployees.map(employee => (
                                                        <li
                                                            key={employee.id}
                                                            className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                            onClick={() => handleEmployeeSelect(employee)}
                                                        >
                                                            {employee.first_name} {employee.last_name} ({employee.email})
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="px-4 py-2 text-gray-500">
                                                        {employeeSearchTerm ? 'No employees found' : 'No employees available'}
                                                    </li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="submit"
                            className={`w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm
                                ${isSaving ? 'bg-[#b88b1b] cursor-not-allowed' : 'bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]'}
                            `}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                'Update Task'
                            )}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={onCancel}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateTaskModal;