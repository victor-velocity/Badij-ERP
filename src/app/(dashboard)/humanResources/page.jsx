'use client';

import React, { useState, useEffect, useMemo } from 'react';
import DashboardCard from '@/components/hr/DashboardCard';
import Attendance from '@/components/hr/AttendanceTable';
import ShiftManagement from '@/components/hr/ShiftsTable';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const isPending = (item) => item.status && item.status.toLowerCase() === 'pending';

export default function HRManagerDashboardPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');

    const [pendingLeaveRequests, setPendingLeaveRequests] = useState(0);
    const [loadingLeaves, setLoadingLeaves] = useState(true);
    const [allLeaves, setAllLeaves] = useState(0);

    const [totalEmployees, setTotalEmployees] = useState(0);
    const [prevTotalEmployees, setPrevTotalEmployees] = useState(0);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const [totalTasks, setTotalTasks] = useState(0);
    const [pendingTasks, setPendingTasks] = useState(0);
    const [loadingTasks, setLoadingTasks] = useState(true);

    const [assignedShiftsDashboard, setAssignedShiftsDashboard] = useState([]);
    const [loadingShiftsDashboard, setLoadingShiftsDashboard] = useState(true);
    const [errorShiftsDashboard, setErrorShiftsDashboard] = useState(null);

    const totalUnassignedShifts = useMemo(() => {
        return assignedShiftsDashboard.filter(shift => shift.shiftType === 'Unassigned').length;
    }, [assignedShiftsDashboard]);

    const totalAssignedShifts = useMemo(() => {
        return totalEmployees - totalUnassignedShifts;
    }, [totalEmployees, totalUnassignedShifts]);


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
                hour12: true,
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            setLoadingEmployees(true);
            try {
                const employees = await apiService.getEmployees(router);
                
                // Filter out terminated employees
                const activeEmployees = employees.filter(emp => 
                    emp.employment_status?.toLowerCase() !== 'terminated'
                );

                setTotalEmployees(activeEmployees.length);

                const employeesCurrentMonth = activeEmployees.filter(emp => {
                    const hireDate = new Date(emp.created_at);
                    return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
                });
                
                // Calculate previous month's total excluding current month hires (simplified metric)
                const prevMonthEmployees = activeEmployees.length - employeesCurrentMonth.length;
                setPrevTotalEmployees(prevMonthEmployees);

            } catch (error) {
                console.error('Failed to fetch employees data:', error);
            } finally {
                setLoadingEmployees(false);
            }

            setLoadingLeaves(true);
            try {
                const allLeaves = await apiService.getLeaves(router);
                setAllLeaves(allLeaves.length)
                const pendingLeaves = allLeaves.filter(isPending);
                setPendingLeaveRequests(pendingLeaves.length);

            } catch (error) {
                console.error('Failed to fetch leave requests data:', error);
            } finally {
                setLoadingLeaves(false);
            }

            setLoadingTasks(true);
            try {
                const allTasks = await apiService.getTasks(router);
                setTotalTasks(allTasks.length); 

                const pendingTasksData = allTasks.filter(isPending);
                setPendingTasks(pendingTasksData.length);

            } catch (error) {
                console.error('Failed to fetch tasks data:', error);
            } finally {
                setLoadingTasks(false);
            }

            setLoadingShiftsDashboard(true);
            setErrorShiftsDashboard(null);
            try {
                const employeesData = await apiService.getEmployees(router);
                
                // Filter terminated employees again for shifts
                const activeEmployeesForShifts = employeesData.filter(emp => 
                    emp.employment_status?.toLowerCase() !== 'terminated'
                );

                const today = new Date();
                const todayFormatted = today.toLocaleDateString('en-US');

                const transformedAssignedShifts = activeEmployeesForShifts.map(employee => ({
                    id: employee.id,
                    employee: {
                        name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
                        email: employee.email || 'N/A',
                        avatar: employee.avatar_url || '/default-profile.png',
                    },
                    department: employee.departments?.name || 'N/A',
                    shiftType: employee.shift_types?.name || 'Unassigned',
                    shiftTypeId: employee.shift_types?.id || null,
                    date: todayFormatted,
                    startTime: employee.shift_types?.start_time ? employee.shift_types.start_time.substring(0, 5) : 'N/A',
                    endTime: employee.shift_types?.end_time ? employee.shift_types.end_time.substring(0, 5) : 'N/A',
                    originalEmployeeData: employee,
                }));

                setAssignedShiftsDashboard(transformedAssignedShifts);
            } catch (err) {
                console.error('Failed to fetch assigned shifts for dashboard:', err);
                setErrorShiftsDashboard(err.message || 'Failed to load shift data.');
            } finally {
                setLoadingShiftsDashboard(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    const employeeChangeRaw = totalEmployees - prevTotalEmployees;
    const employeeChangePercentage = prevTotalEmployees !== 0 ? ((employeeChangeRaw / prevTotalEmployees) * 100).toFixed(2) : totalEmployees > 0 ? 100 : 0;
    const employeeChangeType = employeeChangeRaw >= 0 ? 'increase' : 'decrease';
    const employeeChangeDetails = employeeChangeRaw >= 0 ? `+${employeeChangeRaw} since last month` : `${employeeChangeRaw} since last month`;

    return (
        <div>
            <div className='flex justify-between items-center my-5 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>HR Dashboard</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Welcome to Madison Jay dashboard</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            <div className="flex justify-between flex-wrap gap-6 p-4 rounded-lg border border-gray-200 shadow-sm">
                
                <DashboardCard
                    title="Total Employee"
                    value={loadingEmployees ? '-' : totalEmployees.toString()}
                    change={loadingEmployees ? '...' : `${employeeChangeType === 'increase' ? '+' : ''}${employeeChangePercentage}%`}
                    changeType={employeeChangeType}
                    link="/humanResources/employees"
                    changedetails={loadingEmployees ? '...' : employeeChangeDetails}
                />

                <DashboardCard
                    title="Pending Tasks"
                    value={loadingTasks ? '-' : pendingTasks.toString()}
                    change={loadingTasks ? '...' : ''}
                    changeType={'none'}
                    link="/humanResources/tasks"
                    changedetails={loadingTasks ? '...' : `Total Tasks Assigned: ${totalTasks.toString()}`}
                />

                <DashboardCard
                    title="Pending Leave Requests"
                    value={loadingLeaves ? '-' : pendingLeaveRequests.toString()}
                    change={loadingLeaves ? '...' : ''}
                    changeType={'none'}
                    link="/humanResources/leave"
                    changedetails={loadingLeaves ? '...' : `Total Leaves Requested: ${allLeaves.toString()}`}
                />

                <DashboardCard
                    title="Unassigned Shifts"
                    value={loadingShiftsDashboard ? '-' : totalUnassignedShifts.toString()}
                    change={loadingShiftsDashboard ? '...' : ''}
                    changeType={'none'}
                    link="/humanResources/shifts"
                    changedetails={loadingShiftsDashboard ? '...' : `Total Number of Assigned Shifts: ${totalAssignedShifts.toString()}`}
                />
            </div>
            <div className="flex flex-wrap lg:flex-nowrap gap-6 w-full">
                <div className="w-full lg:w-3/5">
                    <Attendance />
                </div>
                <div className="w-full lg:w-2/5">
                    <ShiftManagement
                        shifts={assignedShiftsDashboard}
                        loading={loadingShiftsDashboard}
                        error={errorShiftsDashboard}
                    />
                </div>
            </div>
        </div>
    );
}