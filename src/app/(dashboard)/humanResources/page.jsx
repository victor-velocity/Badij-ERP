'use client';

import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/hr/DashboardCard';
import Attendance from '@/components/hr/AttendanceTable';
import ShiftManagement from '@/components/hr/ShiftsTable';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

export default function HRManagerDashboardPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');

    const [totalLeaveRequests, setTotalLeaveRequests] = useState(0);
    const [prevTotalLeaveRequests, setPrevTotalLeaveRequests] = useState(0);
    const [loadingLeaves, setLoadingLeaves] = useState(true);

    const [totalEmployees, setTotalEmployees] = useState(0);
    const [prevTotalEmployees, setPrevTotalEmployees] = useState(0);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const [totalTasksIssued, setTotalTasksIssued] = useState(0);
    const [prevTotalTasksIssued, setPrevTotalTasksIssued] = useState(0);
    const [loadingTasks, setLoadingTasks] = useState(true);

    const [assignedShiftsDashboard, setAssignedShiftsDashboard] = useState([]);
    const [loadingShiftsDashboard, setLoadingShiftsDashboard] = useState(true);
    const [errorShiftsDashboard, setErrorShiftsDashboard] = useState(null);

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

            const lastMonthDate = new Date();
            lastMonthDate.setMonth(now.getMonth() - 1);
            const lastMonth = lastMonthDate.getMonth();
            const lastMonthYear = lastMonthDate.getFullYear();

            setLoadingEmployees(true);
            try {
                const employees = await apiService.getEmployees(router);
                setTotalEmployees(employees.length);

                const employeesCurrentMonth = employees.filter(emp => {
                    const hireDate = new Date(emp.created_at);
                    return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
                });
                const employeesLastMonth = employees.filter(emp => {
                    const hireDate = new Date(emp.created_at);
                    return hireDate.getMonth() === lastMonth && hireDate.getFullYear() === lastMonthYear;
                });

                const prevMonthEmployees = employees.length - employeesCurrentMonth.length;
                setPrevTotalEmployees(prevMonthEmployees);

            } catch (error) {
                console.error('Failed to fetch employees data:', error);
            } finally {
                setLoadingEmployees(false);
            }

            setLoadingLeaves(true);
            try {
                const allLeaves = await apiService.getLeaves(router);
                setTotalLeaveRequests(allLeaves.length);

                const leavesCurrentMonth = allLeaves.filter(leave => {
                    const leaveDate = new Date(leave.created_at);
                    return leaveDate.getMonth() === currentMonth && leaveDate.getFullYear() === currentYear;
                });
                const leavesLastMonth = allLeaves.filter(leave => {
                    const leaveDate = new Date(leave.created_at);
                    return leaveDate.getMonth() === lastMonth && leaveDate.getFullYear() === lastMonthYear;
                });
                
                const prevMonthLeaves = allLeaves.length - leavesCurrentMonth.length;
                setPrevTotalLeaveRequests(prevMonthLeaves);

            } catch (error) {
                console.error('Failed to fetch leave requests data:', error);
            } finally {
                setLoadingLeaves(false);
            }

            setLoadingTasks(true);
            try {
                const allTasks = await apiService.getTasks(router);
                setTotalTasksIssued(allTasks.length);

                const tasksCurrentMonth = allTasks.filter(task => {
                    const taskDate = new Date(task.created_at);
                    return taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear;
                });
                const tasksLastMonth = allTasks.filter(task => {
                    const taskDate = new Date(task.created_at);
                    return taskDate.getMonth() === lastMonth && taskDate.getFullYear() === lastMonthYear;
                });
                
                const prevMonthTasks = allTasks.length - tasksCurrentMonth.length;
                setPrevTotalTasksIssued(prevMonthTasks);

            } catch (error) {
                console.error('Failed to fetch tasks data:', error);
            } finally {
                setLoadingTasks(false);
            }

            setLoadingShiftsDashboard(true);
            setErrorShiftsDashboard(null);
            try {
                const employeesData = await apiService.getEmployees(router);

                const today = new Date();
                const todayFormatted = today.toLocaleDateString('en-US');

                const transformedAssignedShifts = employeesData.map(employee => ({
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

    const taskChangeRaw = totalTasksIssued - prevTotalTasksIssued;
    const taskChangePercentage = prevTotalTasksIssued !== 0 ? ((taskChangeRaw / prevTotalTasksIssued) * 100).toFixed(2) : totalTasksIssued > 0 ? 100 : 0;
    const taskChangeType = taskChangeRaw >= 0 ? 'increase' : 'decrease';
    const taskChangeDetails = taskChangeRaw >= 0 ? `+${taskChangeRaw} since last month` : `${taskChangeRaw} since last month`;

    const leaveRequestChangeRaw = totalLeaveRequests - prevTotalLeaveRequests;
    const leaveRequestChangePercentage = prevTotalLeaveRequests !== 0 ? ((leaveRequestChangeRaw / prevTotalLeaveRequests) * 100).toFixed(2) : totalLeaveRequests > 0 ? 100 : 0;
    const leaveRequestChangeType = leaveRequestChangeRaw >= 0 ? 'increase' : 'decrease';
    const leaveRequestChangeDetails = leaveRequestChangeRaw >= 0 ? `+${leaveRequestChangeRaw} since last month` : `${leaveRequestChangeRaw} since last month`;

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
                    title="Total Tasks Issued"
                    value={loadingTasks ? '-' : totalTasksIssued.toString()}
                    change={loadingTasks ? '...' : `${taskChangeType === 'increase' ? '+' : ''}${taskChangePercentage}%`}
                    changeType={taskChangeType}
                    link="/humanResources/tasks"
                    changedetails={loadingTasks ? '...' : taskChangeDetails}
                />

                <DashboardCard
                    title="Total Leave Request"
                    value={loadingLeaves ? '-' : totalLeaveRequests.toString()}
                    change={loadingLeaves ? '...' : `${leaveRequestChangeType === 'increase' ? '+' : ''}${leaveRequestChangePercentage}%`}
                    changeType={leaveRequestChangeType}
                    link="/humanResources/leave"
                    changedetails={loadingLeaves ? '...' : leaveRequestChangeDetails}
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