"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faUpload, faFileAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";

const AddTaskModal = ({ isOpen, onClose, onAddTask }) => {
    const supabase = createClient();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        start_date: '',
        end_date: '',
        attachments: null,
        attachment_url: null,
    });

    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [allEmployees, setAllEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [dataError, setDataError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const router = useRouter();
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            setDataError(null);
            try {
                const employees = await apiService.getEmployees(router);
                setAllEmployees(employees);
                setFilteredEmployees(employees);
                console.error("Failed to fetch employees:", err);
                setDataError(err.message || "Failed to load employees.");
            } finally {
                setLoadingData(false);
            }
        };

        if (isOpen) {
            fetchData();
        }

        return () => {
            if (attachmentPreview) {
                URL.revokeObjectURL(attachmentPreview);
            }
        };
    }, [isOpen, router, attachmentPreview]);

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
        const file = e.target.files[0];
        if (file) {
            setFormData(prevData => ({
                ...prevData,
                attachments: file
            }));
            if (file.type.startsWith('image/')) {
                setAttachmentPreview(URL.createObjectURL(file));
            } else {
                setAttachmentPreview(null);
            }
        } else {
            setFormData(prevData => ({
                ...prevData,
                attachments: null,
                attachment_url: null
            }));
            setAttachmentPreview(null);
        }
    };

    const handleEmployeeSelect = (employeeId, employeeName) => {
        setFormData(prevData => ({
            ...prevData,
            assigned_to: employeeId
        }));
        setSearchTerm(employeeName);
        setDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { title, description, assigned_to, start_date, end_date, attachments } = formData;

        if (!assigned_to) {
            console.error("Please select an employee.");
            alert("Please select an employee.");
            setIsSubmitting(false);
            return;
        }

        let finalAttachmentUrl = null;

        try {
            if (attachments) {
                const timestamp = Date.now();
                const originalFileName = attachments.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const fileName = `${timestamp}_${originalFileName}`;
                const filePath = `task_attachments/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('taskattachments')
                    .upload(filePath, attachments, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(`Error uploading file: ${uploadError.message}`);
                }

                const { data: publicUrlData } = supabase.storage
                    .from('task_attachments')
                    .getPublicUrl(filePath);

                if (publicUrlData && publicUrlData.publicUrl) {
                    finalAttachmentUrl = publicUrlData.publicUrl;
                } else {
                    throw new Error('Could not get public URL for the uploaded file.');
                }
            }

            const newTaskData = {
                title,
                description,
                assigned_to,
                start_date,
                end_date,
                status: 'In Progress',
                attachment_url: finalAttachmentUrl,
            };

            await apiService.createTask(newTaskData, router);

            alert("Task added successfully!");
            setFormData({
                title: '',
                description: '',
                assigned_to: '',
                start_date: '',
                end_date: '',
                attachments: null,
                attachment_url: null,
            });
            setAttachmentPreview(null);
            setSearchTerm('');
            setDropdownOpen(false);
            onClose();
            if (onAddTask) {
                onAddTask();
            }
        } catch (err) {
            console.error("Failed to add task:", err);
            let errorMessage = `Error adding task: ${err.message}`;
            if (err.response && err.response.data && err.response.data.details) {
                errorMessage = "Error adding task:\n" + err.response.data.details.map(detail => detail.msg).join("\n");
            }
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
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

                        <div className="mb-4 relative" ref={dropdownRef}>
                            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                                Assign to
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="assigned_to_search"
                                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 pr-10"
                                    placeholder="Search and select an employee"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setDropdownOpen(true);
                                        setFormData(prevData => ({ ...prevData, assigned_to: '' })); // Clear selection when typing
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
                                                className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleEmployeeSelect(employee.id, `${employee.first_name} ${employee.last_name}`)}
                                            >
                                                {employee.first_name} {employee.last_name}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-2 text-gray-500">No employees found.</li>
                                    )}
                                </ul>
                            )}
                            {formData.assigned_to && ( // Show selected employee name if an ID is selected
                                <p className="mt-2 text-sm text-gray-600">
                                    Selected: **{allEmployees.find(emp => emp.id === formData.assigned_to)?.first_name} {allEmployees.find(emp => emp.id === formData.assigned_to)?.last_name}**
                                </p>
                            )}
                            {!formData.assigned_to && ( // Show error message if no employee is selected
                                <p className="mt-2 text-sm text-red-500">Please select an employee.</p>
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
                                    {attachmentPreview && formData.attachments?.type.startsWith('image/') ? (
                                        <img src={attachmentPreview} alt="Attachment Preview" className="mx-auto h-24 w-24 object-contain rounded-md" />
                                    ) : formData.attachments ? (
                                        <FontAwesomeIcon icon={faFileAlt} className="mx-auto h-12 w-12 text-gray-400" />
                                    ) : (
                                        <FontAwesomeIcon icon={faUpload} className="mx-auto h-12 w-12 text-gray-400" />
                                    )}
                                    <div className="flex text-sm text-gray-600 justify-center">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md bg-white font-medium text-[#b88b1b] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#b88b1b] focus-within:ring-offset-2 hover:text-[#a67c18]"
                                        >
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="attachments" type="file" className="sr-only" onChange={handleFileChange} disabled={isSubmitting} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                    {formData.attachments && <p className="text-sm text-gray-800 mt-2">Selected: {formData.attachments.name}</p>}
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
                                {isSubmitting ? 'Adding task...' : 'Add task'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AddTaskModal;