"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarDays, faCheck, faTimes, faCalendarMinus, faClock,
    faChevronLeft, faChevronRight, faRefresh
} from '@fortawesome/free-solid-svg-icons';
import AttendanceCard from "@/components/employee/attendance/AttendanceCard";
import AttendanceTable from "@/components/employee/attendance/AttendanceTable";
import Pagination from "@/components/employee/attendance/AttendancePagination";

const attendanceTableData = [
    { date: 'July 01', day: 'Monday', clockIn: '8:00 AM', clockOut: '5:00 PM', hoursWorked: '9hrs 0min', status: 'Present', notes: '-' },
    { date: 'July 02', day: 'Tuesday', clockIn: '8:15 AM', clockOut: '5:00 PM', hoursWorked: '8hrs 45min', status: 'Late', notes: 'Came late' },
    { date: 'July 03', day: 'Wednesday', clockIn: '-', clockOut: '-', hoursWorked: '0h', status: 'Absent', notes: 'Sick leave' },
    { date: 'July 04', day: 'Thursday', clockIn: '8:00 AM', clockOut: '5:00 PM', hoursWorked: '9hrs 0min', status: 'Present', notes: '-' },
    { date: 'July 05', day: 'Friday', clockIn: '8:00 AM', clockOut: '5:00 PM', hoursWorked: '9hrs 0min', status: 'Present', notes: '-' },
    { date: 'July 06', day: 'Saturday', clockIn: '-', clockOut: '-', hoursWorked: '-', status: 'Weekend', notes: '-' },
    { date: 'July 07', day: 'Sunday', clockIn: '-', clockOut: '-', hoursWorked: '-', status: 'Weekend', notes: '-' },
    { date: 'July 08', day: 'Monday', clockIn: '10:00 AM', clockOut: '5:00 PM', hoursWorked: '7hrs 0min', status: 'Late', notes: 'Came late' },
    { date: 'July 09', day: 'Tuesday', clockIn: '-', clockOut: '-', hoursWorked: '0h', status: 'Absent', notes: 'Sick leave' },
    { date: 'July 10', day: 'Wednesday', clockIn: '8:00 AM', clockOut: '5:00 PM', hoursWorked: '9hrs 0min', status: 'Present', notes: '-' },
];

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const AttendancePage = () => {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [first_name, setFirstName] = useState('');

    // Attendance card data
    const attendanceData = {
        totalWorkingDays: 22,
        daysPresent: 18,
        daysAbsent: 2,
        leavesTaken: 2,
        lateArrivals: 3
    };

    const cards = [
        { label: 'Total working days', value: attendanceData.totalWorkingDays, icon: faCalendarDays, color: 'text-blue-500' },
        { label: 'Days present', value: attendanceData.daysPresent, icon: faCheck, color: 'text-green-500' },
        { label: 'Days absent', value: attendanceData.daysAbsent, icon: faTimes, color: 'text-red-500' },
        { label: 'Leaves taken', value: attendanceData.leavesTaken, icon: faCalendarMinus, color: 'text-yellow-500' },
        { label: 'Late arrivals', value: attendanceData.lateArrivals, icon: faClock, color: 'text-purple-500' }
    ];

    const [currentMonthIndex, setCurrentMonthIndex] = useState(6);
    const [currentYear, setCurrentYear] = useState(2025);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;
    const totalItems = attendanceTableData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePreviousMonth = () => {
        if (currentMonthIndex === 0) {
            setCurrentMonthIndex(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonthIndex(currentMonthIndex - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonthIndex === 11) {
            setCurrentMonthIndex(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonthIndex(currentMonthIndex + 1);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const currentMonthData = attendanceTableData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        const storedFirstName = localStorage.getItem('first_name');
        if (storedFirstName) {
            setFirstName(storedFirstName);
        }

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

        updateDateTimeAndGreeting();
        const intervalId = setInterval(updateDateTimeAndGreeting, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-10 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Attendance Summary</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                {cards.map((card, index) => (
                    <AttendanceCard
                        key={index}
                        label={card.label}
                        value={card.value}
                        icon={card.icon}
                        color={card.color}
                    />
                ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <h2 className="text-xl font-bold text-gray-800">{months[currentMonthIndex]} {currentYear}</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handlePreviousMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-[#b88b1b] bg-gray-200 transition-all hover:text-white"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-[#b88b1b] bg-gray-200 transition-all hover:text-white"
                        >
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="py-2 px-4 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-transparent"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </span>
                    </div>
                    <button className="bg-[#b88b1b] text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 hover:bg-[#916e17] transition-colors duration-200">
                        <FontAwesomeIcon icon={faRefresh} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Attendance Table */}
            <AttendanceTable data={currentMonthData} />

            {/* Pagination */}
            <div className="mt-8 flex justify-center">
                <Pagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

export default AttendancePage;