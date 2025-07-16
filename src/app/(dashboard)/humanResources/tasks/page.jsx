"use client";

import React, {  useState, useEffect } from "react";

export default function TaskPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
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
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Task management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization’s teams</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
        </div>
    );
}