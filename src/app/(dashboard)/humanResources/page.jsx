// app/humanResources/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import DashboardCard from '@/components/humanResources/DashboardCard';
import Attendance from '@/components/humanResources/AttendanceTable';
import ShiftManagement from '@/components/humanResources/ShiftsTable';

export default function HRManagerDashboardPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = {
                weekday: 'long', // "Monday"
                year: 'numeric', // "2025"
                month: 'long', // "July"
                day: 'numeric', // "9"
                hour: '2-digit', // "05"
                minute: '2-digit', // "36"
                second: '2-digit', // "24"
                hour12: true // "PM"
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            <div className='flex justify-between items-center my-5'>
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
                    value="54"
                    change="+10%"
                    changeType="increase"
                    link="/employees"
                    changedetails="+4 since last month"
                />

                <DashboardCard
                    title="Total Salaries Paid"
                    value="N 5.2 million"
                    change="-2.8%"
                    changeType="decrease"
                    link="/salaries"
                    changedetails='-N400,000 since last month'
                />

                <DashboardCard
                    title="Total Leave Request"
                    value="50"
                    change="+12"
                    changeType="increase"
                    link="/leave-requests"
                    changedetails='+12 since last month'
                />
            </div>
            <div className="flex flex-wrap lg:flex-nowrap gap-6 w-full">
                <div className="w-full lg:w-3/5">
                    <Attendance />
                </div>
                <div className="w-full lg:w-2/5">
                    <ShiftManagement />
                </div>
            </div>
        </div>
    );
}