"use client";

import React, { useState, useEffect, useCallback } from "react";
import ShiftCard from "@/components/hr/shift/ShiftCard";
import ViewShiftModal from "@/components/hr/shift/ViewShiftModal";
import UpdateShiftModal from "@/components/hr/shift/UpdateShiftModal";
import ManageShiftTypesModal from "@/components/hr/shift/ManageShiftTypesModal";
import CreateShiftTypeModal from "@/components/hr/shift/CreateShiftTypeModal"; // New component
import ShiftTable from "@/components/hr/shift/ShiftTable";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faQuestionCircle, faSun, faCloudSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ShiftPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAssignShiftModalOpen, setIsAssignShiftModalOpen] = useState(false);
    const [isManageShiftTypesModalOpen, setIsManageShiftTypesModalOpen] = useState(false);
    const [isCreateShiftTypeModalOpen, setIsCreateShiftTypeModalOpen] = useState(false); // New state
    const [selectedShift, setSelectedShift] = useState(null);
    const [isViewShiftModalOpen, setIsViewShiftModalOpen] = useState(false);
    const [allAssignedShifts, setAllAssignedShifts] = useState([]);
    const [shiftTypes, setShiftTypes] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]); // New state for all employees
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [employeeToUpdateShift, setEmployeeToUpdateShift] = useState(null);

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

    const fetchAssignedShifts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const shiftSchedules = await apiService.getCurrentShiftSchedules(router);
            const transformedAssignedShifts = shiftSchedules.map(schedule => ({
                id: schedule.id,
                employee: {
                    id: schedule.employee?.id || 'N/A',
                    name: `${schedule.employee?.first_name || ''} ${schedule.employee?.last_name || ''}`.trim() || 'N/A',
                    email: schedule.employee?.email || 'N/A',
                    avatar_url: schedule.employee?.avatar_url || '/default-profile.png',
                    first_name: schedule.employee?.first_name || '',
                    last_name: schedule.employee?.last_name || ''
                },
                department: schedule.employee?.departments?.name || 'N/A',
                shiftType: schedule.shift_types?.name || 'Unassigned',
                shiftTypeId: schedule.shift_type_id || null,
                date: schedule.start_date ? new Date(schedule.start_date).toLocaleDateString('en-US') : 'N/A',
                endDate: schedule.end_date ? new Date(schedule.end_date).toLocaleDateString('en-US') : 'N/A',
                startTime: schedule.shift_types?.start_time?.substring(0, 5) || 'N/A',
                endTime: schedule.shift_types?.end_time?.substring(0, 5) || 'N/A',
                originalScheduleData: schedule
            }));

            setAllAssignedShifts(transformedAssignedShifts);
        } catch (err) {
            console.error("Failed to fetch shift schedules:", err);
            setError(err.message || "Failed to load shift schedules.");
            toast.error(err.message || "Failed to load shift schedules.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    const fetchShiftTypes = async () => {
        try {
            const data = await apiService.getShifts(router);
            setShiftTypes(data);
        } catch (err) {
            console.error("Failed to fetch shift types:", err);
            toast.error(err.message || "Failed to load shift types.");
        }
    };

    const fetchAllEmployees = async () => {
        try {
            const data = await apiService.getEmployees(router);
            setAllEmployees(data);
        } catch (err) {
            console.error("Failed to fetch employees:", err);
            toast.error(err.message || "Failed to load employees.");
        }
    };

    useEffect(() => {
        fetchAssignedShifts();
        fetchShiftTypes();
        fetchAllEmployees(); // New fetch for employees
    }, [fetchAssignedShifts, router]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleUpdateShiftSchedule = async (assignmentData) => {
        try {
            const { scheduleId, shiftTypeId, startDate, endDate, employeeId } = assignmentData;
            if (scheduleId) {
                const updatedScheduleData = {
                    shift_type_id: shiftTypeId === "unassign" ? null : shiftTypeId,
                    start_date: startDate,
                    end_date: endDate
                };
                await apiService.updateShiftSchedule(scheduleId, updatedScheduleData, router);
                toast.success("Shift schedule updated successfully!");
            } else {
                const newScheduleData = {
                    employee_id: employeeId, // Use selected employeeId for new assignments
                    shift_type_id: shiftTypeId,
                    start_date: startDate,
                    end_date: endDate
                };
                await apiService.createShiftSchedule(newScheduleData, router);
                toast.success("Shift schedule assigned successfully!");
            }
            setIsAssignShiftModalOpen(false);
            setEmployeeToUpdateShift(null);
            fetchAssignedShifts();
        } catch (err) {
            console.error("Error updating shift schedule:", err);
            toast.error(err.message || "Failed to update shift schedule.");
        }
    };

    const handleCreateShiftType = async (shiftTypeData) => {
        try {
            await apiService.createShift(router, shiftTypeData);
            toast.success("Shift type created successfully!");
            setIsCreateShiftTypeModalOpen(false);
            fetchShiftTypes();
            fetchAssignedShifts();
        } catch (err) {
            console.error("Error creating shift type:", err);
            toast.error(err.message || "Failed to create shift type.");
        }
    };

    const handleUpdateShiftType = async (shiftTypeId, updatedShiftTypeData) => {
        toast.loading("Updating shift type...", { id: `update-shift-type-${shiftTypeId}` });
        try {
            await apiService.updateShift(shiftTypeId, updatedShiftTypeData, router);
            toast.success("Shift type updated successfully!", { id: `update-shift-type-${shiftTypeId}` });
            fetchShiftTypes();
            fetchAssignedShifts();
        } catch (err) {
            console.error("Error updating shift type:", err);
            toast.error(`Failed to update shift type: ${err.message || "Unknown error"}`, { 
                id: `update-shift-type-${shiftTypeId}` 
            });
        }
    };

    const renderSearchBar = () => (
        <div className="relative rounded-md shadow-sm w-full max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#b88b1b] sm:text-sm sm:leading-6 focus:border-0"
                placeholder="Search shifts..."
                value={searchTerm}
                onChange={handleSearchChange}
            />
        </div>
    );

    const filteredShifts = allAssignedShifts.filter(shift => {
        if (!shift) return false;
        const searchTermLower = searchTerm.toLowerCase();
        return (
            shift.employee?.name?.toLowerCase().includes(searchTermLower) ||
            shift.department?.toLowerCase().includes(searchTermLower) ||
            shift.shiftType?.toLowerCase().includes(searchTermLower)
        );
    });

    const unassignedCount = allAssignedShifts.filter(s => s.shiftType === 'Unassigned').length;

    return (
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Shift Management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Organize and track employee work schedules efficiently.</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between mb-14">
                <ShiftCard 
                    title="Unassigned Shifts" 
                    count={unassignedCount} 
                    loading={loading} 
                    icon={faQuestionCircle}
                    bgColor="bg-red-50"
                    textColor="text-red-700"
                />
                <ShiftCard 
                    title="Morning Shifts" 
                    count={allAssignedShifts.filter(s => s.shiftType === 'Morning').length} 
                    loading={loading} 
                    icon={faSun}
                    bgColor="bg-yellow-50"
                    textColor="text-yellow-700"
                />
                <ShiftCard 
                    title="Afternoon Shifts" 
                    count={allAssignedShifts.filter(s => s.shiftType === 'Afternoon').length} 
                    loading={loading} 
                    icon={faCloudSun}
                    bgColor="bg-blue-50"
                    textColor="text-blue-700"
                />
                <ShiftCard 
                    title="Night Shifts" 
                    count={allAssignedShifts.filter(s => s.shiftType === 'Night').length} 
                    loading={loading} 
                    icon={faMoon}
                    bgColor="bg-gray-50"
                    textColor="text-gray-700"
                />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-6 bg-white border-b border-gray-200 rounded-t-lg">
                <h1 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">Shift Schedules</h1>
                <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
                    {renderSearchBar()}

                    <button
                        onClick={() => {
                            // Open the modal without pre-filling any employee → it will be in “Assign” mode
                            setEmployeeToUpdateShift({
                                employee: { id: null, name: '', email: '', avatar_url: '' },
                                originalScheduleData: null   // <-- tells the modal it’s a new assignment
                            });
                            setIsAssignShiftModalOpen(true);
                        }}
                        className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] w-full md:w-auto"
                    >
                        Assign Shift
                    </button>

                    <button
                        onClick={() => setIsCreateShiftTypeModalOpen(true)}
                        className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] w-full md:w-auto"
                    >
                        Create Shift Type
                    </button>
                    <button
                        onClick={() => setIsManageShiftTypesModalOpen(true)}
                        className="whitespace-nowrap px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#b88b1b] hover:bg-[#a67c18] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b88b1b] w-full md:w-auto"
                    >
                        Manage Shift Types
                    </button>
                </div>
            </div>

            <div className="mt-0">
                <ShiftTable
                    shifts={filteredShifts}
                    onViewShift={(shift) => {
                        setSelectedShift(shift);
                        setIsViewShiftModalOpen(true);
                    }}
                    onOpenUpdateShiftModal={(shift) => {
                        setEmployeeToUpdateShift(shift);
                        setIsAssignShiftModalOpen(true);
                    }}
                    loading={loading}
                    error={error}
                />
            </div>

            <UpdateShiftModal
                isOpen={isAssignShiftModalOpen}
                onClose={() => {
                    setIsAssignShiftModalOpen(false);
                    setEmployeeToUpdateShift(null);
                }}
                onAssignShift={handleUpdateShiftSchedule}
                shiftTypes={shiftTypes}
                employee={employeeToUpdateShift}
                allEmployees={allEmployees} // Pass allEmployees to modal
            />

            <ViewShiftModal
                isOpen={isViewShiftModalOpen}
                onClose={() => setIsViewShiftModalOpen(false)}
                shift={selectedShift}
            />

            <ManageShiftTypesModal
                isOpen={isManageShiftTypesModalOpen}
                onClose={() => setIsManageShiftTypesModalOpen(false)}
                shiftTypes={shiftTypes}
                onUpdateShiftType={handleUpdateShiftType}
                onDeleteShiftType={async (shiftTypeId) => {
                    try {
                        await apiService.deleteShift(shiftTypeId, router);
                        toast.success("Shift type deleted successfully!");
                        fetchShiftTypes();
                        fetchAssignedShifts();
                    } catch (err) {
                        console.error("Error deleting shift type:", err);
                        toast.error(err.message || "Failed to delete shift type.");
                    }
                }}
            />

            <CreateShiftTypeModal
                isOpen={isCreateShiftTypeModalOpen}
                onClose={() => setIsCreateShiftTypeModalOpen(false)}
                onCreateShiftType={handleCreateShiftType}
            />
        </div>
    );
}