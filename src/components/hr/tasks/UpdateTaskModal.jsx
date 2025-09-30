"use client";

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faTrash, faUpload, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { createClient } from "@/app/lib/supabase/client";

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const UpdateTaskModal = ({ show, task, onCancel }) => {
    const supabase = createClient();
    const router = useRouter();
    const dropdownRef = useRef(null);

    const [activeSection, setActiveSection] = useState('basic');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        priority: 'medium',
        id: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [assignedEmployees, setAssignedEmployees] = useState([]);
    const [newDocuments, setNewDocuments] = useState([]);
    const [employeesToAdd, setEmployeesToAdd] = useState([]);
    const [employeesToRemove, setEmployeesToRemove] = useState([]);

    useEffect(() => {
        if (show && task) {
            console.log('Task data:', task);

            // Get all assigned employees from task_assignments
            const currentAssignedEmployees = task.task_assignments?.map(assignment => assignment.employees) || [];

            setFormData({
                title: task.title || '',
                description: task.description || '',
                start_date: formatDateForInput(task.start_date),
                end_date: formatDateForInput(task.end_date),
                priority: task.priority || 'medium',
                id: task.id,
            });

            setAssignedEmployees(currentAssignedEmployees);
            setEmployeeSearchTerm('');
            setEmployeesToAdd([]);
            setEmployeesToRemove([]);
            setNewDocuments([]);
            setActiveSection('basic');
        }
    }, [show, task]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const fetchedEmployees = await apiService.getEmployees(router);
                const activeEmployees = fetchedEmployees.filter(
                    employee => employee.employment_status?.toLowerCase() !== 'terminated'
                );
                setAllEmployees(activeEmployees);
                setFilteredEmployees(activeEmployees);
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
            emp.email?.toLowerCase().includes(lowercasedSearchTerm))
        );
        setFilteredEmployees(filtered);
    }, [employeeSearchTerm, allEmployees]);

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
        // Check if employee is already assigned or pending addition
        const isAlreadyAssigned = assignedEmployees.some(emp => emp.id === employee.id);
        const isPendingAddition = employeesToAdd.some(item => item.id === employee.id);

        if (!isAlreadyAssigned && !isPendingAddition) {
            setEmployeesToAdd(prev => [...prev, { ...employee, pending: true }]);
            setEmployeeSearchTerm('');
            setDropdownOpen(false);
            toast.success(`${employee.first_name} ${employee.last_name} will be added to the task`);
        } else if (isPendingAddition) {
            toast.error("Employee is already pending addition");
        } else {
            toast.error("Employee is already assigned to this task");
        }
    };

    const handleRemoveEmployee = (employeeId, isPendingAddition = false) => {
        if (isPendingAddition) {
            // Remove from pending additions
            setEmployeesToAdd(prev => prev.filter(item => item.id !== employeeId));
            toast.success("Pending addition cancelled");
        } else {
            // Mark for removal from actual assignments
            setEmployeesToRemove(prev => [...prev, employeeId]);
            toast.success("Employee will be removed from the task");
        }
    };

    const handleCancel = () => {
        // Clear all pending changes
        setEmployeesToAdd([]);
        setEmployeesToRemove([]);
        onCancel();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newDocs = files.map(file => ({
                file,
                name: file.name,
                type: file.type,
                category: 'assignment',
                preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
            }));
            setNewDocuments(prev => [...prev, ...newDocs]);
        }
    };

    const handleRemoveNewDocument = (indexToRemove) => {
        setNewDocuments(prev => {
            const updatedDocs = [...prev];
            const removedDoc = updatedDocs[indexToRemove];
            if (removedDoc.preview) {
                URL.revokeObjectURL(removedDoc.preview);
            }
            return updatedDocs.filter((_, index) => index !== indexToRemove);
        });
    };

    const handleRemoveExistingDocument = async (documentId) => {
        try {
            setIsSaving(true);
            await apiService.deleteTaskDocument(task.id, documentId, router);
            toast.success("Document removed successfully!");
            // Refresh the page after successful removal
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (error) {
            console.error("Error removing document:", error);
            toast.error("Failed to remove document.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Validate form data
            if (activeSection === 'basic') {
                if (!formData.title || !formData.description) {
                    throw new Error("Title and description are required");
                }
                if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
                    throw new Error("Start date cannot be after end date");
                }
            }

            // Prepare the consolidated update payload
            const updatedTaskPayload = {
                ...(activeSection === 'basic' && {
                    title: formData.title,
                    description: formData.description,
                    start_date: formData.start_date,
                    end_date: formData.end_date,
                    priority: formData.priority,
                }),
            };

            // Update task with basic info
            if (activeSection === 'basic') {
                await apiService.updateTask(task.id, updatedTaskPayload, router);
            }

            // Handle documents separately - upload and add to task
            if (activeSection === 'documents' && newDocuments.length > 0) {
                // Upload each document and get the document object
                const uploadedDocuments = await Promise.all(
                    newDocuments.map(async (doc) => {
                        const filePath = `task_documents/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                        const { error: uploadError } = await supabase.storage
                            .from('taskattachments')
                            .upload(filePath, doc.file);
                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                            .from('taskattachments')
                            .getPublicUrl(filePath);

                        return {
                            category: doc.category,
                            name: doc.name,
                            type: doc.type,
                            url: publicUrl,
                        };
                    })
                );

                // Add each document to the task individually
                for (const document of uploadedDocuments) {
                    await apiService.addTaskDocument(task.id, document, router);
                }
            }

            // Handle employee assignments
            if (activeSection === 'employees') {
                // Remove employees
                await Promise.all(
                    employeesToRemove.map(employeeId =>
                        apiService.removeEmployeeFromTask(task.id, employeeId, router)
                    )
                );

                // Add new employees
                await Promise.all(
                    employeesToAdd.map(employee =>
                        apiService.addEmployeeToTask(task.id, employee.id, router)
                    )
                );
            }

            // Show a single success toast based on the active section
            toast.success(
                activeSection === 'basic'
                    ? "Task details updated successfully!"
                    : activeSection === 'employees'
                        ? "Employee assignments updated successfully!"
                        : "Documents added successfully!"
            );

            // Clean up and refresh the page
            newDocuments.forEach(doc => {
                if (doc.preview) URL.revokeObjectURL(doc.preview);
            });
            setNewDocuments([]);
            setEmployeesToAdd([]);
            setEmployeesToRemove([]);

            // Refresh the page after successful update
            setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error(error.message || "Failed to update task. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!show) {
        return null;
    }

    const renderBasicSection = () => (
        <div className="space-y-4">
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
                    />
                </div>
            </div>
            <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                    name="priority"
                    id="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 border"
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>
        </div>
    );

    const renderEmployeesSection = () => (
        <div className="space-y-4">
            <div className="mb-4 relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign Employees to Task
                </label>

                <div className="relative">
                    <input
                        type="text"
                        className="block w-full rounded-md border border-gray-300 focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2 pr-10"
                        placeholder="Search employee to assign"
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
                            filteredEmployees.map(employee => {
                                const isAssigned = assignedEmployees.some(emp => emp.id === employee.id);
                                const isPendingAddition = employeesToAdd.some(item => item.id === employee.id);

                                return (
                                    <li
                                        key={employee.id}
                                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${isAssigned || isPendingAddition ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'
                                            }`}
                                        onClick={() => !isAssigned && !isPendingAddition && handleEmployeeSelect(employee)}
                                    >
                                        {employee.first_name} {employee.last_name} ({employee.email})
                                        {isAssigned && <span className="ml-2 text-xs text-gray-500">(Already assigned)</span>}
                                        {isPendingAddition && <span className="ml-2 text-xs text-blue-500">(Pending addition)</span>}
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-4 py-2 text-gray-500">
                                {employeeSearchTerm ? 'No employees found' : 'No employees available'}
                            </li>
                        )}
                    </ul>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Assignments
                </label>
                {assignedEmployees.length > 0 || employeesToAdd.length > 0 ? (
                    <div className="space-y-2">
                        {/* Currently assigned employees */}
                        {assignedEmployees.map(employee => (
                            <div key={employee.id} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                                <span className="text-sm">
                                    {employee.first_name} {employee.last_name}
                                    {employee.email && ` (${employee.email})`}
                                    {employeesToRemove.includes(employee.id) && (
                                        <span className="ml-2 text-xs text-red-500">(Will be removed)</span>
                                    )}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveEmployee(employee.id, false)}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                    disabled={isSaving || employeesToRemove.includes(employee.id)}
                                >
                                    <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                                </button>
                            </div>
                        ))}

                        {/* Pending additions */}
                        {employeesToAdd.map(employee => (
                            <div key={employee.id} className="flex items-center justify-between bg-blue-50 rounded-md p-3">
                                <span className="text-sm text-blue-700">
                                    {employee.first_name} {employee.last_name}
                                    {employee.email && ` (${employee.email})`}
                                    <span className="ml-2 text-xs">(Will be added)</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveEmployee(employee.id, true)}
                                    className="text-red-500 hover:text-red-700 ml-2"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">No employees assigned to this task.</p>
                )}
            </div>

            {(employeesToAdd.length > 0 || employeesToRemove.length > 0) && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">Pending Changes:</h4>
                    {employeesToAdd.length > 0 && (
                        <div className="text-sm text-green-600">
                            + {employeesToAdd.length} employee(s) to be added
                        </div>
                    )}
                    {employeesToRemove.length > 0 && (
                        <div className="text-sm text-red-600">
                            - {employeesToRemove.length} employee(s) to be removed
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderDocumentsSection = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Documents
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        disabled={isSaving}
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-[#b88b1b] hover:text-[#a67c18] font-medium"
                    >
                        <FontAwesomeIcon icon={faUpload} className="mr-2" />
                        Select files to upload
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, PDF, DOCX etc.</p>
                </div>

                {newDocuments.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">New documents to upload:</h4>
                        <ul className="space-y-2">
                            {newDocuments.map((doc, index) => (
                                <li key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-2">
                                    <div className="flex items-center">
                                        <FontAwesomeIcon icon={faFileAlt} className="text-gray-400 mr-2" />
                                        <span className="text-sm">{doc.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveNewDocument(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {task.task_documents && task.task_documents.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Existing Documents
                    </label>
                    <div className="space-y-2">
                        {task.task_documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                                <div className="flex items-center">
                                    <FontAwesomeIcon icon={faFileAlt} className="text-gray-400 mr-2" />
                                    <div>
                                        <p className="text-sm font-medium">{doc.name}</p>
                                        <p className="text-xs text-gray-500">{doc.type} • {doc.category}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#b88b1b] hover:text-[#a67c18]"
                                    >
                                        View
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveExistingDocument(doc.id)}
                                        className="text-red-500 hover:text-red-700"
                                        disabled={isSaving}
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#000000aa] flex items-center justify-center">
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-y-scroll shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-h-[90vh]">
                <form onSubmit={handleSubmit}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Update Task
                                </h3>

                                {/* Navigation Tabs */}
                                <div className="mt-4 border-b border-gray-200">
                                    <nav className="-mb-px flex space-x-8">
                                        {['basic', 'employees', 'documents'].map((section) => (
                                            <button
                                                key={section}
                                                type="button"
                                                onClick={() => setActiveSection(section)}
                                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeSection === section
                                                    ? 'border-[#b88b1b] text-[#b88b1b]'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                {section === 'basic' && 'Basic Info'}
                                                {section === 'employees' && 'Employees'}
                                                {section === 'documents' && 'Documents'}
                                            </button>
                                        ))}
                                    </nav>
                                </div>

                                <div className="mt-4">
                                    {activeSection === 'basic' && renderBasicSection()}
                                    {activeSection === 'employees' && renderEmployeesSection()}
                                    {activeSection === 'documents' && renderDocumentsSection()}
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
                                `Update ${activeSection === 'basic' ? 'Task' : activeSection === 'employees' ? 'Assignment' : 'Documents'}`
                            )}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            onClick={handleCancel}
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