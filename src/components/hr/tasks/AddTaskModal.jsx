// components/hr/tasks/AddTaskModal.js
"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faUpload, faFileAlt, faImage } from '@fortawesome/free-solid-svg-icons';

const AddTaskModal = ({ isOpen, onClose, onAddTask }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);

    const [allEmployees, setAllEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    useEffect(() => {
        const fetchAllEmployees = () => {
            return [
                { id: 'emp1', name: 'John Doe', email: 'john@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=JD', departmentId: 'dep1' }, // HR
                { id: 'emp2', name: 'Fuad Abdulrauf', email: 'fuad@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=FA', departmentId: 'dep2' }, // IT
                { id: 'emp3', name: 'Victor Oluwatobi', email: 'victor@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=VO', departmentId: 'dep3' }, // Sales
                { id: 'emp4', name: 'Mary Smith', email: 'mary@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=MS', departmentId: 'dep1' }, // HR
                { id: 'emp5', name: 'Isreal Inene', email: 'isreal@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=II', departmentId: 'dep2' }, // IT
                { id: 'emp6', name: 'Esther John', email: 'esther@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=EJ', departmentId: 'dep4' }, // Marketing
                { id: 'emp7', name: 'Victor Bakare', email: 'victor@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=VB', departmentId: 'dep3' }, // Sales
                { id: 'emp8', name: 'Gabriel Timothy', email: 'gabriel@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=GT', departmentId: 'dep5' }, // R&D
                { id: 'emp9', name: 'Sophia Lee', email: 'sophia@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=SL', departmentId: 'dep1' }, // HR
                { id: 'emp10', name: 'Daniel Kim', email: 'daniel@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=DK', departmentId: 'dep2' }, // IT
                { id: 'emp11', name: 'Olivia Chen', email: 'olivia@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=OC', departmentId: 'dep4' }, // Marketing
                { id: 'emp12', name: 'Michael Brown', email: 'michael@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=MB', departmentId: 'dep5' }, // R&D
                { id: 'emp13', name: 'Emily White', email: 'emily@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=EW', departmentId: 'dep3' }, // Sales
                { id: 'emp14', name: 'Chris Green', email: 'chris@madisonjay.com', avatar: 'https://via.placeholder.com/32/F0F0F0/000000?text=CG', departmentId: 'dep1' }, // HR
            ];
        };

        const fetchDepartments = () => {
            return [
                { id: 'dep1', name: 'HR' },
                { id: 'dep2', name: 'IT' },
                { id: 'dep3', name: 'Sales' },
                { id: 'dep4', name: 'Marketing' },
                { id: 'dep5', name: 'R&D' },
            ];
        };

        setAllEmployees(fetchAllEmployees());
        setDepartments(fetchDepartments());

        return () => {
            if (attachmentPreview) {
                URL.revokeObjectURL(attachmentPreview);
            }
        };
    }, [attachmentPreview]);

    useEffect(() => {
        if (departmentId) {
            setFilteredEmployees(allEmployees.filter(emp => emp.departmentId === departmentId));
        } else {
            setFilteredEmployees([]);
        }
        setAssignedToId('');
    }, [departmentId, allEmployees]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const selectedEmployee = allEmployees.find(emp => emp.id === assignedToId);
        const selectedDepartment = departments.find(dep => dep.id === departmentId);

        if (!selectedEmployee || !selectedDepartment) {
            console.error("Please select a valid employee and department.");
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            taskTitle,
            taskDescription,
            assignedTo: {
                name: selectedEmployee.name,
                email: selectedEmployee.email,
                avatar: selectedEmployee.avatar
            },
            department: selectedDepartment.name,
            startDate,
            dueDate,
            status: 'In-progress',
            attachments: attachmentFile ? [{
                name: attachmentFile.name,
                type: attachmentFile.type,
                size: attachmentFile.size,
                preview: attachmentPreview,
                url: '#'
            }] : [],
        };

        console.log("New Task:", newTask);
        if (onAddTask) {
            onAddTask(newTask);
        }

        setTaskTitle('');
        setTaskDescription('');
        setAssignedToId('');
        setDepartmentId('');
        setStartDate('');
        setDueDate('');
        setAttachmentFile(null);
        setAttachmentPreview(null);
        onClose();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachmentFile(file);
            if (file.type.startsWith('image/')) {
                setAttachmentPreview(URL.createObjectURL(file));
            } else {
                setAttachmentPreview(null);
            }
        } else {
            setAttachmentFile(null);
            setAttachmentPreview(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] h-screen bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                >
                    <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-medium mb-6">Add New Task</h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Task title
                        </label>
                        <input
                            type="text"
                            id="taskTitle"
                            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                            placeholder="Write the task title here"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">
                            Task Description (Optional)
                        </label>
                        <textarea
                            id="taskDescription"
                            rows="3"
                            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                            placeholder="Add a detailed description for the task..."
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                            Department
                        </label>
                        <select
                            id="department"
                            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            required
                        >
                            <option value="">Select the department</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="assignTo" className="block text-sm font-medium text-gray-700 mb-1">
                            Assign to
                        </label>
                        <select
                            id="assignTo"
                            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                            value={assignedToId}
                            onChange={(e) => setAssignedToId(e.target.value)}
                            required
                            disabled={filteredEmployees.length === 0}
                        >
                            <option value="">
                                {departmentId ? (filteredEmployees.length > 0 ? "Select an employee" : "No employees in this department") : "Select a department first"}
                            </option>
                            {filteredEmployees.map(employee => (
                                <option key={employee.id} value={employee.id}>{employee.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Start date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    id="startDate"
                                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm pr-10 p-2"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Due date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    id="dueDate"
                                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm pr-10 p-2"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
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
                                {attachmentPreview && attachmentFile?.type.startsWith('image/') ? (
                                    <img src={attachmentPreview} alt="Attachment Preview" className="mx-auto h-24 w-24 object-contain rounded-md" />
                                ) : attachmentFile ? (
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
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                {attachmentFile && <p className="text-sm text-gray-800 mt-2">Selected: {attachmentFile.name}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-offset-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent bg-[#b88b1b] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-offset-2"
                        >
                            Add task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;