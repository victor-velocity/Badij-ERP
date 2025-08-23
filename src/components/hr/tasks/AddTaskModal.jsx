"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faUpload, faFileAlt, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import toast from 'react-hot-toast';

const AddTaskModal = ({ isOpen, onClose, onAddTask }) => {
    const supabase = createClient();
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'Pending',
        priority: 'medium',
        documents: []
    });

    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            setDataError(null);
            try {
                const employees = await apiService.getEmployees(router);
                setAllEmployees(employees);
                setFilteredEmployees(employees);
            } catch (error) {
                console.error("Failed to fetch employees:", error);
                setDataError(error.message || "Failed to load employees.");
            } finally {
                setLoadingData(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, router]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredEmployees(
                allEmployees.filter(employee =>
                    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredEmployees(allEmployees);
        }
    }, [searchTerm, allEmployees]);

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
    }, []);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newDocuments = files.map(file => ({
                file,
                name: file.name,
                type: file.type,
                category: 'assignment',
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
            }));

            setFormData(prevData => ({
                ...prevData,
                documents: [...prevData.documents, ...newDocuments]
            }));
        }
    };

    const handleRemoveAttachment = (indexToRemove) => {
        setFormData(prevData => {
            const updatedDocs = [...prevData.documents];
            const removedDoc = updatedDocs[indexToRemove];
            if (removedDoc.preview) {
                URL.revokeObjectURL(removedDoc.preview);
            }
            return {
                ...prevData,
                documents: updatedDocs.filter((_, index) => index !== indexToRemove)
            };
        });
    };

    const handleEmployeeSelect = (employee) => {
        if (!selectedEmployees.some(e => e.id === employee.id)) {
            setSelectedEmployees(prev => [...prev, employee]);
            setSearchTerm('');
            setDropdownOpen(false);
        }
    };

    const handleRemoveEmployee = (employeeId) => {
        setSelectedEmployees(prev => prev.filter(e => e.id !== employeeId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const taskData = {
                title: formData.title,
                description: formData.description,
                start_date: formData.start_date,
                end_date: formData.end_date,
                priority: formData.priority,
                status: 'Pending'
            };

            const taskResponse = await apiService.createTask(taskData, router);

            if (!taskResponse || !taskResponse.task.id) {
                throw new Error("Failed to create task: Invalid response from server");
            }

            const taskId = taskResponse.task.id;

            if (selectedEmployees.length > 0) {
                const employeeIds = selectedEmployees.map(employee => employee.id);
                await apiService.addEmployeesToTask(taskId, employeeIds, router);
            }

            if (formData.documents.length > 0) {
                await Promise.all(
                    formData.documents.map(async (doc) => {
                        const filePath = `task_documents/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

                        const { error: uploadError } = await supabase.storage
                            .from('taskattachments')
                            .upload(filePath, doc.file);
                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('taskattachments')
                            .getPublicUrl(filePath);

                        const documentData = {
                            name: doc.name,
                            url: publicUrl,
                            type: doc.type,
                            category: doc.category || 'assignment',
                            task_id: taskId
                        };

                        await apiService.addTaskDocument(taskId, documentData, router);
                    })
                );
            }

            toast.success("Task created successfully!");
            onClose();
            resetForm();
            if (onAddTask) onAddTask();

        } catch (error) {
            console.error("Task creation failed:", error);
            const errorMessage = error.message || "Task creation failed";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            start_date: '',
            end_date: '',
            status: 'Pending',
            priority: 'medium',
            documents: []
        });
        setSelectedEmployees([]);
        setSearchTerm('');
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] h-screen bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                    disabled={isSubmitting}
                >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-medium mb-6">Add New Task</h2>

                {loadingData ? (
                    <div className="text-center py-10">Loading data...</div>
                ) : dataError ? (
                    <div className="text-center py-10 text-red-600">Error: {dataError}</div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Task title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                                placeholder="Write the task title here"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Task Description (Optional)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows="3"
                                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                                placeholder="Add a detailed description for the task..."
                                value={formData.description}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                id="priority"
                                name="priority"
                                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                                value={formData.priority}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
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
                                                disabled={isSubmitting}
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
                                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 pr-10"
                                    placeholder="Search and select employees"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setDropdownOpen(true);
                                    }}
                                    onFocus={() => setDropdownOpen(true)}
                                    disabled={isSubmitting}
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
                                                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${selectedEmployees.some(e => e.id === employee.id) ? 'bg-gray-100' : ''
                                                    }`}
                                                onClick={() => handleEmployeeSelect(employee)}
                                            >
                                                {employee.first_name} {employee.last_name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">No employees found.</li>
                                    )}
                                </ul>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Start date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="start_date"
                                        name="start_date"
                                        className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm pr-10 p-2"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                                    End date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="end_date"
                                        name="end_date"
                                        className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm pr-10 p-2"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attachments
                            </label>
                            <div
                                className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6 focus:outline-none focus:border-0"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleFileChange({ target: { files: e.dataTransfer.files } });
                                }}
                            >
                                <div className="space-y-1 text-center">
                                    <FontAwesomeIcon icon={faUpload} className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md bg-white font-medium text-[#b88b1b] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#b88b1b] focus-within:ring-offset-2 hover:text-[#a67c18]"
                                        >
                                            <span>Upload files</span>
                                            <input
                                                id="file-upload"
                                                name="documents"
                                                type="file"
                                                multiple
                                                className="sr-only"
                                                onChange={handleFileChange}
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF, PDF, DOCX etc. up to 5MB each</p>

                                    {formData.documents.length > 0 && (
                                        <ul className="mt-4 text-left">
                                            {formData.documents.map((doc, index) => (
                                                <li key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                                                    <div className="flex items-center">
                                                        {doc.preview ? (
                                                            <img src={doc.preview} alt="Document Preview" className="h-10 w-10 object-contain rounded-md mr-3" />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faFileAlt} className="h-6 w-6 text-gray-500 mr-3" />
                                                        )}
                                                        <span className="text-sm text-gray-800 break-all">{doc.name}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAttachment(index)}
                                                        className="ml-4 text-red-500 hover:text-red-700"
                                                        disabled={isSubmitting}
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-offset-2"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center rounded-md border border-transparent bg-[#b88b1b] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-offset-2"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating task...' : 'Create task'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddTaskModal;