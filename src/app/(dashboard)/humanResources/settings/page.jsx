// src/app/dashboard/settings/page.jsx (Conceptual HR Admin Settings Page)
"use client";

import React, { useState, useEffect } from 'react';
import HolidayCalendarManager from '@/components/hr/setting/HolidayCalendarManager';
import DataManagement from '@/components/hr/setting/DataManagement';

export default function HrDashboardSettingsPage() {
    const [currentDateTime, setCurrentDateTime] = useState('')
    
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

    return (
        <div className="">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Settings</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>View and manage holidays and data</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="space-y-8">
                <HolidayCalendarManager />
                <DataManagement />

                {/* You can add more settings sections here */}
                {/* E.g., User & Role Management, Policy Configuration, etc. */}
                {/* <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">User & Role Management</h2>
                    <p className="text-gray-700 dark:text-gray-300">Manage HR user accounts and their permissions.</p>
                </div> */}
            </div>
        </div>
    );
}