"use client"

import React, { useState, useEffect, useMemo } from "react"
import apiService from "@/app/lib/apiService";

const InventoryEmployees = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [employeesPerPage] = useState(15);

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

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const allEmployees = await apiService.getEmployees();
                const InventoryEmployees = allEmployees.filter(
                    emp => 
                        emp.departments?.name.toLowerCase() === 'warehouse' &&
                        emp.employment_status.toLowerCase() === 'active'
                );
                setEmployees(InventoryEmployees);
            } catch (error) {
                console.error("Error fetching employees:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    }
    
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            `${emp.first_name} ${emp.last_name}`
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
        );
    }, [employees, searchQuery]);

    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(
        indexOfFirstEmployee,
        indexOfLastEmployee
    );

    // Calculate total pages
    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

    // Handle page change
    const paginate = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
        </tr>
    );

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Active Inventory Employees</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="mb-7 flex justify-end">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Position</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hire Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Leave Balance</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Shift</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <>
                                <SkeletonRow />
                                <SkeletonRow />
                                <SkeletonRow />
                            </>
                        ) : currentEmployees.length > 0 ? (
                            currentEmployees.map((emp) => (
                                <tr key={emp.id} className="border-t border-gray-300 border-solid">
                                    <td className="px-6 py-5 text-sm text-gray-900">{`${emp.first_name} ${emp.last_name}`}</td>
                                    <td className="px-6 py-5 text-sm text-gray-900">{emp.position}</td>
                                    <td className="px-6 py-5 text-sm text-gray-900">{emp.email}</td>
                                    <td className="px-6 py-5 text-sm text-gray-900">{emp.phone_number || 'N/A'}</td>
                                    <td className="px-6 py-5 text-sm text-gray-900">{emp.employment_status}</td>
                                    <td className="px-6 py-5 text-sm text-gray-900">{emp.hire_date}</td>
                                    <td className="px-6 py-5 text-sm text-gray-900">{emp.leave_balance}</td>
                                    <td className="px-6 py-5 text-sm text-gray-900">{emp.shift_types?.name || 'N/A'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                    No active inventory employees found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {!loading && filteredEmployees.length > 0 && (
                <div className="flex justify-between items-center mt-7">
                    <div className="text-sm text-gray-700">
                        Showing {indexOfFirstEmployee + 1} to {Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length} employees
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg ${currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-[#b88b1b] text-white hover:bg-[#8a7412]'}`}
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => paginate(i + 1)}
                                className={`px-4 py-2 rounded-lg ${currentPage === i + 1 ? 'bg-[#b88b1b] text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg ${currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-[#b88b1b] text-white hover:bg-[#8a7412]'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default InventoryEmployees;