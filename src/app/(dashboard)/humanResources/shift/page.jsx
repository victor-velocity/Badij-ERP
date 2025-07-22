"use client";

import React, { useState, useEffect } from "react";
import ShiftCard from "@/components/hr/shift/ShiftCard";
import ViewShiftModal from "@/components/hr/shift/ViewShiftModal";
import AddShiftModal from "@/components/hr/shift/AddShiftModal";
import ShiftTable from "@/components/hr/shift/ShiftTable";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

export default function ShiftPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [isViewShiftModalOpen, setIsViewShiftModalOpen] = useState(false);
    const [allShifts, setAllShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const fetchShifts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getShifts(router);
            setAllShifts(data);
        } catch (err) {
            console.error("Failed to fetch shifts:", err);
            setError(err.message || "Failed to load shifts.");
            toast.error(err.message || "Failed to load shifts.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleAddShift = async (newShiftData) => {
        try {
            await apiService.createShift(newShiftData, router);
            toast.success("Shift added successfully!");
            setIsAddShiftModalOpen(false);
            fetchShifts();
        } catch (err) {
            console.error("Error adding shift:", err);
            toast.error(err.message || "Failed to add shift.");
        }
    };

    const handleUpdateShift = async (shiftId, updatedShiftData) => {
        try {
            await apiService.updateShift(shiftId, updatedShiftData, router);
            toast.success("Shift updated successfully!");
            fetchShifts();
        } catch (err) {
            console.error("Error updating shift:", err);
            toast.error(err.message || "Failed to update shift.");
        }
    };

    const handleDeleteShift = async (shiftId) => {
        if (window.confirm("Are you sure you want to delete this shift?")) {
            try {
                await apiService.deleteShift(shiftId, router);
                toast.success("Shift deleted successfully!");
                fetchShifts();
            } catch (err) {
                console.error("Error deleting shift:", err);
                toast.error(err.message || "Failed to delete shift.");
            }
        }
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

    const filteredShifts = allShifts.filter(shift => {
        const employeeName = shift.employee ? `${shift.employee.first_name} ${shift.employee.last_name}` : '';
        const departmentName = shift.department?.name || '';
        return (
            employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.shift_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shift.note?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

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
                <ShiftCard title="Morning Shifts" count={allShifts.filter(s => s.shift_type === 'Morning').length} />
                <ShiftCard title="Evening Shifts" count={allShifts.filter(s => s.shift_type === 'Evening').length} />
                <ShiftCard title="Night Shifts" count={allShifts.filter(s => s.shift_type === 'Night').length} />
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
                    onUpdateShift={handleUpdateShift}
                    onDeleteShift={handleDeleteShift}
                    loading={loading}
                    error={error}
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