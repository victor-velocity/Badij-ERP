"use client"

import StocksTable from "@/components/sales/stocks/StocksTable";
import React, { useState, useEffect } from "react";

const StockManagement = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'products', 'components'
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const first_name = localStorage.getItem('first_name');

    const updateDateTimeAndGreeting = () => {
        const now = new Date();
        const hours = now.getHours();

        if (hours >= 5 && hours < 12) {
            setGreeting('Good Morning');
        } else if (hours >= 12 && hours < 18) {
            setGreeting('Good Afternoon');
        } else {
            setGreeting('Good Evening');
        }

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

    useEffect(() => {
        updateDateTimeAndGreeting();
        const intervalId = setInterval(updateDateTimeAndGreeting, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // Reset to first page when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm]);

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Stock Summary</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            
            <div className="mb-9">
                <div className="flex flex-wrap gap-4 items-center justify-right">
                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Filter:</label>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#153087]"
                        >
                            <option value="all">All Items</option>
                            <option value="product">Products</option>
                            <option value="component">Components</option>
                        </select>
                    </div>

                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[200px]">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or SKU..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153087]"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <StocksTable 
                    filter={filter}
                    searchTerm={searchTerm}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                />
            </div>
        </div>
    )
}

export default StockManagement