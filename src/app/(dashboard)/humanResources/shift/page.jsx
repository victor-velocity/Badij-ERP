"use client";

import React, { useState, useEffect } from "react";
import ShiftCard from "@/components/hr/shift/ShiftCard";
import ViewShiftModal from "@/components/hr/shift/ViewShiftModal";
import AddShiftModal from "@/components/hr/shift/AddShiftModal";
import ShiftTable from "@/components/hr/shift/ShiftTable";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export default function ShiftPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [isViewShiftModalOpen, setIsViewShiftModalOpen] = useState(false);

    const [allShifts, setAllShifts] = useState([
        {
            id: 's1',
            employee: { name: 'John Doe', email: 'john@madisonjay.com' },
            department: 'HR',
            shiftType: 'Morning',
            date: '2025-07-17',
            startTime: '08:00',
            endTime: '16:00',
            note: 'Morning shift, focusing on onboarding new hires.',
        },
        {
            id: 's2',
            employee: { name: 'Fuad Abdulrauf', email: 'fuad@madisonjay.com' },
            department: 'IT',
            shiftType: 'Evening',
            date: '2025-07-17',
            startTime: '16:00',
            endTime: '00:00',
            note: 'On-call for server maintenance.',
        },
        {
            id: 's3',
            employee: { name: 'Victor Oluwatobi', email: 'victor@madisonjay.com' },
            department: 'Sales',
            shiftType: 'Morning',
            date: '2025-07-18',
            startTime: '09:00',
            endTime: '17:00',
            note: 'Client meetings all day.',
        },
        {
            id: 's4',
            employee: { name: 'Mary Smith', email: 'mary@madisonjay.com' },
            department: 'HR',
            shiftType: 'Night',
            date: '2025-07-17',
            startTime: '00:00',
            endTime: '08:00',
            note: 'Support for international branches.',
        },
        {
            id: 's5',
            employee: { name: 'Isreal Inene', email: 'isreal@madisonjay.com' },
            department: 'IT',
            shiftType: 'Morning',
            date: '2025-07-18',
            startTime: '08:30',
            endTime: '16:30',
            note: 'Project development and code review.',
        },
        {
            id: 's6',
            employee: { name: 'Sophia Lee', email: 'sophia@madisonjay.com' },
            department: 'Marketing',
            shiftType: 'Evening',
            date: '2025-07-18',
            startTime: '14:00',
            endTime: '22:00',
            note: 'Social media campaign monitoring.',
        },
        {
            id: 's7',
            employee: { name: 'Daniel Kim', email: 'daniel@madisonjay.com' },
            department: 'R&D',
            shiftType: 'Morning',
            date: '2025-07-19',
            startTime: '07:00',
            endTime: '15:00',
            note: 'Lab work and experiments.',
        },
         {
            id: 's8',
            employee: { name: 'Michael Brown', email: 'michael@madisonjay.com' },
            department: 'Sales',
            shiftType: 'Evening',
            date: '2025-07-19',
            startTime: '17:00',
            endTime: '01:00',
            note: 'Late calls with East Asian clients.',
        },
    ]);

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleAddShift = (newShift) => {
        setAllShifts((prevShifts) => [newShift, ...prevShifts]);
    };

    const handleViewShift = (shift) => {
        setSelectedShift(shift);
        setIsViewShiftModalOpen(true);
    };

    const renderSearchBar = (placeholder = 'Search...', value, onChange) => {
        return (
            <div className="relative rounded-md shadow-sm w-full max-w-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#b88b1b] sm:text-sm sm:leading-6"
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
            </div>
        );
    };

    const filteredShifts = allShifts.filter(shift =>
        shift.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.shiftType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shift.note.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-[1400px] mx-auto p-4">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Shift Management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Organize and track employee work schedules efficiently.</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="flex flex-wrap gap-5 items-center justify-between mb-14">
                <ShiftCard title="All Shifts" count={allShifts.length} />
                <ShiftCard title="Morning Shifts" count={allShifts.filter(s => s.shiftType === 'Morning').length} />
                <ShiftCard title="Evening Shifts" count={allShifts.filter(s => s.shiftType === 'Evening').length} />
                <ShiftCard title="Night Shifts" count={allShifts.filter(s => s.shiftType === 'Night').length} />
            </div>

            <div className="flex items-center justify-between p-4 md:p-6 bg-white border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">Shift List</h1>
                <div className="flex items-center space-x-4">
                    {renderSearchBar('Search shifts...', searchTerm, handleSearchChange)}
                    <button
                        onClick={() => setIsAddShiftModalOpen(true)}
                        className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b]"
                    >
                        Add New Shift
                    </button>
                </div>
            </div>

            <div className="mt-6">
                <ShiftTable
                    shifts={filteredShifts}
                    searchTerm={searchTerm}
                    onViewShift={handleViewShift}
                />
            </div>

            <AddShiftModal
                isOpen={isAddShiftModalOpen}
                onClose={() => setIsAddShiftModalOpen(false)}
                onAddShift={handleAddShift}
            />

            <ViewShiftModal
                isOpen={isViewShiftModalOpen}
                onClose={() => setIsViewShiftModalOpen(false)}
                shift={selectedShift}
            />
        </div>
    );
}