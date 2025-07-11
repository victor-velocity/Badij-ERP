"use client"

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';

const DEFAULT_AVATAR = 'https://placehold.co/40x40/cccccc/000000?text=👤';

const generateUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getRandomDate = (start, end) => {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
};

const getRandomTimestamp = (start, end) => {
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString();
};

const NIGERIAN_CITIES_STATES = [
    { city: "Lagos", state: "Lagos", zip_code: "100001" },
    { city: "Abuja", state: "FCT", zip_code: "900001" },
    { city: "Port Harcourt", state: "Rivers", zip_code: "500001" },
    { city: "Kano", state: "Kano", zip_code: "700001" },
    { city: "Ibadan", state: "Oyo", zip_code: "200001" },
    { city: "Enugu", state: "Enugu", zip_code: "400001" },
    { city: "Calabar", state: "Cross River", zip_code: "540001" },
    { city: "Benin City", state: "Edo", zip_code: "300001" },
    { city: "Kaduna", state: "Kaduna", zip_code: "800001" },
    { city: "Jos", state: "Plateau", zip_code: "930001" },
];

const NIGERIAN_FIRST_NAMES = [
    "Chinedu", "Fatima", "Oluwaseun", "Aisha", "Emeka", "Zainab", "Tunde", "Amaka",
    "Mohammed", "Ngozi", "David", "Blessing", "Kunle", "Funke", "Segun"
];
const NIGERIAN_LAST_NAMES = [
    "Okoro", "Abdullahi", "Adekunle", "Musa", "Nwachukwu", "Aliyu", "Oladipo", "Chukwu",
    "Ibrahim", "Nwosu", "Akpan", "Eze", "Sani", "Bello", "Okafor"
];

// Departments for employees (updated as per request)
const DEPARTMENTS = [
    "Sales", "Warehouse", "HR", "IT", "Installer", "Loader", "Driver"
];

const POSITIONS = ["Employee"];

const FAKE_EMPLOYEES = Array.from({ length: 20 }, (_, i) => {
    const randomCityState = NIGERIAN_CITIES_STATES[Math.floor(Math.random() * NIGERIAN_CITIES_STATES.length)];
    const firstName = NIGERIAN_FIRST_NAMES[Math.floor(Math.random() * NIGERIAN_FIRST_NAMES.length)];
    const lastName = NIGERIAN_LAST_NAMES[Math.floor(Math.random() * NIGERIAN_LAST_NAMES.length)];
    const phoneNumber = `+234${Math.floor(100000000 + Math.random() * 900000000)}`;
    const department = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
    const position = POSITIONS[0];

    const statuses = ["Pending", "Approved", "Declined"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    let leave_start_date = null;
    let leave_end_date = null;
    let leave_duration = null;
    const request_date = getRandomDate(new Date(2024, 0, 1), new Date());
    if (status === "Pending") {
        const today = new Date();
        const futureStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() + Math.floor(Math.random() * 10) + 1);
        leave_start_date = getRandomDate(futureStart, new Date(futureStart.getFullYear(), futureStart.getMonth() + 1, futureStart.getDate()));
        const endDate = new Date(leave_start_date);
        endDate.setDate(new Date(leave_start_date).getDate() + Math.floor(Math.random() * 10) + 1);
        leave_end_date = endDate.toISOString().split('T')[0];
    } else if (status === "Approved" || status === "Declined") {
        const pastEnd = new Date();
        const pastStart = new Date(pastEnd.getFullYear(), pastEnd.getMonth(), pastEnd.getDate() - (Math.floor(Math.random() * 30) + 1));
        leave_start_date = getRandomDate(pastStart, pastEnd);
        const endDate = new Date(leave_start_date);
        endDate.setDate(new Date(leave_start_date).getDate() + Math.floor(Math.random() * 10) + 1);
        leave_end_date = endDate.toISOString().split('T')[0];
    }

    if (leave_start_date && leave_end_date) {
        const start = new Date(leave_start_date);
        const end = new Date(leave_end_date);
        const diffTime = Math.abs(end - start);
        leave_duration = `${Math.ceil(diffTime / (1000 * 60 * 60 * 24))} days`;
    }


    return {
        id: generateUuid(),
        user_id: generateUuid(),
        first_name: firstName,
        last_name: lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone_number: phoneNumber,
        address: `${Math.floor(Math.random() * 200) + 1} ${["Adewale", "Obafemi", "Victoria", "Aminu", "Kingsway"][Math.floor(Math.random() * 5)]} Rd`,
        city: randomCityState.city,
        state: randomCityState.state,
        zip_code: randomCityState.zip_code,
        country: "Nigeria",
        date_of_birth: getRandomDate(new Date(1970, 0, 1), new Date(2000, 11, 31)),
        hire_date: getRandomDate(new Date(2010, 0, 1), new Date(2024, 11, 31)),
        position_id: generateUuid(),
        position: position,
        department_id: generateUuid(),
        department: department,
        salary: (Math.random() * (150000 - 40000) + 40000).toFixed(2),
        employment_status: status,
        supervisor_id: i % 2 === 0 ? generateUuid() : null,
        created_at: getRandomTimestamp(new Date(2010, 0, 1), new Date()),
        updated_at: getRandomTimestamp(new Date(2010, 0, 1), new Date()),
        leave_start_date: leave_start_date,
        leave_end_date: leave_end_date,
        leave_duration: leave_duration,
        request_date: request_date,
    };
});

const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options).replace(/(\w+) (\d+), (\d+)/, '$2 of $1 $3');
};

const EmployeeRow = ({ employee }) => {
    const [imgSrc, setImgSrc] = useState(employee.avatar || DEFAULT_AVATAR);

    const handleImageError = () => {
        setImgSrc(DEFAULT_AVATAR);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'declined':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };


    return (
        <tr className="hover:bg-gray-50">
            {/* Employee Name and Email */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                        <img
                            className="h-full w-full object-cover rounded-full"
                            src={imgSrc}
                            alt={`${employee.first_name}'s avatar`}
                            onError={handleImageError}
                        />
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{`${employee.first_name} ${employee.last_name}`}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                    </div>
                </div>
            </td>
            {/* Department */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.department || 'N/A'}
            </td>
            {/* Position */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.position || 'N/A'}
            </td>
            {/* Start Date */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.leave_start_date ? formatDate(employee.leave_start_date) : '—'}
            </td>
            {/* End Date */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.leave_end_date ? formatDate(employee.leave_end_date) : '—'}
            </td>
            {/* Number of Leave Days */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.leave_duration || '—'}
            </td>
            {/* Status */}
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.employment_status)}`}>
                    {employee.employment_status}
                </span>
            </td>
            {/* Request Date */} {/* Changed from Actions */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.request_date ? formatDate(employee.request_date) : '—'}
            </td>
        </tr>
    );
};

const LeaveRequestTable = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 5
    const [currentDateTime, setCurrentDateTime] = useState('');

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) {
            return FAKE_EMPLOYEES;
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return FAKE_EMPLOYEES.filter(employee =>
            employee.first_name.toLowerCase().includes(lowercasedSearchTerm) ||
            employee.last_name.toLowerCase().includes(lowercasedSearchTerm) ||
            employee.email.toLowerCase().includes(lowercasedSearchTerm)
        );
    }, [searchTerm]);

    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const renderPaginationNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) pageNumbers.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pageNumbers.push('...');
            pageNumbers.push(totalPages);
        }

        return pageNumbers.map((number, index) => (
            <button
                key={index}
                onClick={() => typeof number === 'number' && paginate(number)}
                className={`px-4 py-2 rounded-md mx-1 text-sm font-medium transition-colors
                    ${number === currentPage ? 'bg-white border border-solid border-[#b88b1b]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    ${number === '...' ? 'cursor-default bg-transparent hover:bg-transparent' : ''}`}
                disabled={number === '...'}
            >
                {number}
            </button>
        ));
    };

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
        <div className="">
            <div className="">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-5 mb-14">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Leave Request Management</h1>
                        <p className="text-[#A09D9D] font-medium mt-2 text-sm">View and manage all leave requests in your organization</p>
                    </div>
                    <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D] text-sm mt-4 sm:mt-0'>
                        {currentDateTime}
                    </span>
                </div>

                {/* Employee List Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Employee list</h2>
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            {/* Search icon */}
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        {/* Filter icon button */}
                        <button
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Filter"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 9.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Employee Table */}
                {filteredEmployees.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No employees found matching your search.</div>
                ) : (
                    <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200 table-container">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th> {/* Changed from Action */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentEmployees.map(employee => (
                                    <EmployeeRow key={employee.id} employee={employee} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {filteredEmployees.length > 0 && (
                    <div className="flex justify-center items-center mt-6 space-x-2">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:text-white hover:bg-[#b88b1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            &lt;
                        </button>
                        {renderPaginationNumbers()}
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:text-white hover:bg-[#b88b1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            &gt;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveRequestTable;