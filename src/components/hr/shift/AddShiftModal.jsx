// components/hr/shift/AddShiftModal.js
"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

const AddShiftModal = ({ isOpen, onClose, onAddShift }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [shiftType, setShiftType] = useState('');
    const [shiftDate, setShiftDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [note, setNote] = useState('');

    // Mock data for employees and departments
    const [allEmployees, setAllEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);

    useEffect(() => {
        // Simulate fetching data
        const fetchAllEmployees = () => {
            return [
                { id: 'emp1', name: 'John Doe', email: 'john@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=JD', departmentId: 'dep1' }, // HR
                { id: 'emp2', name: 'Fuad Abdulrauf', email: 'fuad@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=FA', departmentId: 'dep2' }, // IT
                { id: 'emp3', name: 'Victor Oluwatobi', email: 'victor@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=VO', departmentId: 'dep3' }, // Sales
                { id: 'emp4', name: 'Mary Smith', email: 'mary@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=MS', departmentId: 'dep1' }, // HR
                { id: 'emp5', name: 'Isreal Inene', email: 'isreal@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=II', departmentId: 'dep2' }, // IT
                { id: 'emp6', name: 'Esther John', email: 'esther@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=EJ', departmentId: 'dep4' }, // Marketing
                { id: 'emp7', name: 'Victor Bakare', email: 'victor@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=VB', departmentId: 'dep3' }, // Sales
                { id: 'emp8', name: 'Gabriel Timothy', email: 'gabriel@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=GT', departmentId: 'dep5' }, // R&D
                { id: 'emp9', name: 'Sophia Lee', email: 'sophia@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=SL', departmentId: 'dep1' }, // HR
                { id: 'emp10', name: 'Daniel Kim', email: 'daniel@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=DK', departmentId: 'dep2' }, // IT
                { id: 'emp11', name: 'Olivia Chen', email: 'olivia@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=OC', departmentId: 'dep4' }, // Marketing
                { id: 'emp12', name: 'Michael Brown', email: 'michael@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=MB', departmentId: 'dep5' }, // R&D
                { id: 'emp13', name: 'Emily White', email: 'emily@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=EW', departmentId: 'dep3' }, // Sales
                { id: 'emp14', name: 'Chris Green', email: 'chris@madisonjay.com', avatar: 'https://via.placeholder.com/40x40/F0F0F0/000000?text=CG', departmentId: 'dep1' }, // HR
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
    }, []);

    useEffect(() => {
        if (departmentId) {
            setFilteredEmployees(allEmployees.filter(emp => emp.departmentId === departmentId));
        } else {
            setFilteredEmployees([]);
        }
        setEmployeeId(''); // Reset assigned employee when department changes
    }, [departmentId, allEmployees]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const selectedEmployee = allEmployees.find(emp => emp.id === employeeId);
        const selectedDepartment = departments.find(dep => dep.id === departmentId);

        if (!selectedEmployee || !selectedDepartment || !shiftType || !shiftDate || !startTime || !endTime) {
            console.error("Please fill all required fields.");
            // In a real app, show a user-friendly error message
            return;
        }

        const newShift = {
            id: Date.now().toString(),
            employee: {
                name: selectedEmployee.name,
                email: selectedEmployee.email,
                avatar: selectedEmployee.avatar
            },
            department: selectedDepartment.name,
            shiftType,
            date: shiftDate,
            startTime,
            endTime,
            note,
        };

        console.log("New Shift:", newShift);
        if (onAddShift) {
            onAddShift(newShift);
        }

        // Clear form fields
        setEmployeeId('');
        setDepartmentId('');
        setShiftType('');
        setShiftDate('');
        setStartTime('');
        setEndTime('');
        setNote('');
        onClose();
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
                <h2 className="text-2xl font-medium mb-6">Add New Shift</h2>

                <form onSubmit={handleSubmit}>
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
                        <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
                            Employee
                        </label>
                        <select
                            id="employee"
                            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            required
                            disabled={!departmentId || filteredEmployees.length === 0}
                        >
                            <option value="">
                                {departmentId ? (filteredEmployees.length > 0 ? "Select an employee" : "No employees in this department") : "Select a department first"}
                            </option>
                            {filteredEmployees.map(employee => (
                                <option key={employee.id} value={employee.id}>{employee.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="shiftType" className="block text-sm font-medium text-gray-700 mb-1">
                            Shift Type
                        </label>
                        <select
                            id="shiftType"
                            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                            value={shiftType}
                            onChange={(e) => setShiftType(e.target.value)}
                            required
                        >
                            <option value="">Select shift type</option>
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                            <option value="Night">Night</option>
                            <option value="Flexible">Flexible</option>
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="shiftDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                id="shiftDate"
                                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm pr-10 p-2"
                                value={shiftDate}
                                onChange={(e) => setShiftDate(e.target.value)}
                                required
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <FontAwesomeIcon icon={faCalendarAlt} className="h-5 w-5 text-[#b88b1b]" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time
                            </label>
                            <div className="relative">
                                <input
                                    type="time"
                                    id="startTime"
                                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm pr-10 p-2"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    required
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">

                                    <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-[#b88b1b]" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                                End Time
                            </label>
                            <div className="relative">
                                <input
                                    type="time"
                                    id="endTime"
                                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm pr-10 p-2"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    required
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">

                                    <FontAwesomeIcon icon={faClock} className="h-5 w-5 text-[#b88b1b]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                            Note (Optional)
                        </label>
                        <textarea
                            id="note"
                            rows="3"
                            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#b88b1b] focus:ring-[#b88b1b] sm:text-sm p-2"
                            placeholder="Add any additional notes for this shift..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        ></textarea>
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
                            Add Shift
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddShiftModal;