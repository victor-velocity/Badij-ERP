"use client"

import PayrollCard from '@/components/hr/payroll/PayrollCard';
import Link from 'next/link';
import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faAngleLeft, faAngleRight, faEye } from '@fortawesome/free-solid-svg-icons';
import apiService from '@/app/lib/apiService';
import { toast } from "react-hot-toast";

export default function PayrollPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [payrollData, setPayrollData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const generateAvatar = (firstName, lastName) => {
        const initials = `${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`;
        const colors = ['#FFD700', '#ADD8E6', '#90EE90', '#FFB6C1', '#DDA0DD', '#FFFACD', '#C0C0C0', '#FFDAB9'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `https://placehold.co/40x40/${color.substring(1)}/000?text=${initials.toUpperCase()}`;
    };

    useEffect(() => {
        const fetchEmployeePayments = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getEmployeePayments();
                
                const transformedData = data.map((item) => {
                    const firstName = item.employee_details?.first_name || '';
                    const lastName = item.employee_details?.last_name || '';
                    const employeeEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
                    
                    const mockDate = `Jul 11, 2025 - 09:45 AM`; 

                    return {
                        id: item.employee_details?.id,
                        name: `${firstName} ${lastName}`,
                        email: employeeEmail,
                        date: mockDate,
                        department: item.employee_details?.department,
                        salary: item.salary?.base_salary,
                        bonus: item.salary?.bonus,
                        avatar: generateAvatar(firstName, lastName),
                    };
                });

                setPayrollData(transformedData);
            } catch (err) {
                console.error("Error fetching employees payment:", err);
                setError("Failed to load employees payment. Please try again.");
                toast.error("Failed to load employees payment.");
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeePayments();
    }, []);

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

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...payrollData];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [payrollData, sortConfig]);

    const filteredData = useMemo(() => {
        return sortedData.filter(item =>
            (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [sortedData, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getClassNamesFor = (name) => {
        if (!sortConfig.key) {
            return;
        }
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };

    const getPaginationNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 5;
        const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (startPage > 1) {
            pageNumbers.push(1);
            if (startPage > 2) {
                pageNumbers.push('...');
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }
            pageNumbers.push(totalPages);
        }
        return pageNumbers;
    };

    return (
        <div className="">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-5 mb-14">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Payroll Management</h1>
                    <p className="text-[#A09D9D] font-medium mt-2 text-sm">View and manage all payroll activities in your organization</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D] text-sm mt-4 sm:mt-0'>
                    {currentDateTime}
                </span>
            </div>
            <div className='mb-10 px-5 py-7 bg-[#FDEDC5] text-center rounded-xl'>
                <p className='text-[#A09D9D] text-[16px] font-medium'>Your next payroll is</p>
                <p className='text-black font-medium text-xl my-4'>Pay period (Jul 3, to Aug 10, 2023)</p>
                <p className='text-[#A09D9D] text-[16px] font-medium'>Click prepare payroll to begin running payroll for this period</p>
                <Link href="/humanResources/payroll/prepare-payroll" className='inline-block mt-4 bg-[#b88b1b] text-white px-6 py-2 rounded-lg hover:bg-[#b88b1b]/90 transition-colors duration-300'>Prepare Payroll</Link>
            </div>
            <div className='flex flex-wrap gap-4 justify-between items-center mb-10'>
                <PayrollCard title="Total employees" value={payrollData.length} />
                <PayrollCard title="Total net(N)" value='200,000,000' />
                <PayrollCard title="Total salary(N)" value="500,879,000" />
                <PayrollCard title="Total gross(N)" value="500,000,000" />
            </div>

            <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Recent activity</h3>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b]"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('name')}
                                >
                                    Employee
                                    {getClassNamesFor('name') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('name') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('date')}
                                >
                                    Date and Time
                                    {getClassNamesFor('date') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('date') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('department')}
                                >
                                    Department
                                    {getClassNamesFor('department') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('department') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('salary')}
                                >
                                    Salary
                                    {getClassNamesFor('salary') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('salary') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('bonus')}
                                >
                                    Bonus
                                    {getClassNamesFor('bonus') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('bonus') === 'descending' && ' ↓'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading || error ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        {loading ? "Loading..." : "Failed to load data."}
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full" src={item.avatar} alt={`${item.name}'s avatar`} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                    <div className="text-sm text-gray-500">{item.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.department}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            N {item.salary.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            N {item.bonus.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className='p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-300 cursor-pointer'>
                                                <FontAwesomeIcon icon={faEye} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No matching payroll activities found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-6">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon icon={faAngleLeft} className="mr-2" /> Previous
                    </button>
                    <div className="flex space-x-2">
                        {getPaginationNumbers().map((number, index) => (
                            <button
                                key={index}
                                onClick={() => typeof number === 'number' && paginate(number)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg ${currentPage === number
                                        ? 'bg-[#b88b1b] text-white'
                                        : typeof number === 'number'
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            : 'text-gray-500 cursor-default'
                                    }`}
                                disabled={typeof number !== 'number'}
                            >
                                {number}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next <FontAwesomeIcon icon={faAngleRight} className="ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
}