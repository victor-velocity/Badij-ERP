"use client"

import PayrollCard from '@/components/hr/payroll/PayrollCard';
import Link from 'next/link';
import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';
import apiService from '@/app/lib/apiService';
import { toast } from "react-hot-toast";

// Skeleton Loading Components
const SkeletonPayrollCard = () => (
    <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] bg-white p-4 rounded-lg shadow">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
    </div>
);

const SkeletonTableRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-14"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
    </tr>
);

export default function PayrollPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'descending' });
    const [payrollData, setPayrollData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summaryData, setSummaryData] = useState({
        totalEmployees: 0,
        totalNet: '0',
        totalSalary: '0',
        totalGross: '0',
        totalDeductions: '0'
    });
    const [payPeriod, setPayPeriod] = useState('');

    const generateAvatar = (firstName, lastName) => {
        const initials = `${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`;
        const colors = ['#FFD700', '#ADD8E6', '#90EE90', '#FFB6C1', '#DDA0DD', '#FFFACD', '#C0C0C0', '#FFDAB9'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `https://placehold.co/40x40/${color.substring(1)}/000?text=${initials.toUpperCase()}`;
    };

    const calculatePayPeriod = () => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const startDay = 28;
        const endDay = 3;

        let startDate, endDate;

        if (now.getDate() < endDay) {
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), startDay);
            endDate = new Date(now.getFullYear(), now.getMonth(), endDay);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), startDay);
            endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), endDay);
        }

        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const formattedStartDate = startDate.toLocaleDateString('en-US', options);
        const formattedEndDate = endDate.toLocaleDateString('en-US', options);

        setPayPeriod(`Pay period (${formattedStartDate} to ${formattedEndDate})`);
    };

    useEffect(() => {
        const fetchEmployeePayments = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getEmployeePayments();

                let totalSalarySum = 0;
                let totalGrossSum = 0;
                let totalNetSum = 0;
                let totalDeductionsSum = 0;

                const transformedData = data.map((item) => {
                    // Fixed: Use the correct key from API
                    const employeeDetails = item['month-yearemployee_details'] || {};
                    const firstName = employeeDetails.first_name || '';
                    const lastName = employeeDetails.last_name || '';
                    const email = employeeDetails.email || '';
                    const department = employeeDetails.department || 'N/A';
                    const avatarUrl = employeeDetails.avatar_url || '';

                    const salaryData = item.salary || {};
                    const baseSalary = salaryData.base_salary || 0;
                    const bonus = salaryData.bonus || 0;
                    const incentives = salaryData.incentives || 0;

                    let totalDeductionAmount = 0;
                    const deductions = item.deductions || {};
                    // Fixed: Check both possible detail keys for robustness
                    const detailsKey = deductions.deductions_details ? 'deductions_details' : 'deduction_details';
                    if (deductions[detailsKey] && Array.isArray(deductions[detailsKey])) {
                        totalDeductionAmount = deductions[detailsKey].reduce((sum, detail) => {
                            const instances = detail.instances || 0;
                            const fee = detail.default_fee || 0; 
                            return sum + (fee * instances);
                        }, 0);
                    }
                    totalDeductionAmount -= (deductions.total_pardoned_fee || 0);
                    totalDeductionAmount = Math.max(0, totalDeductionAmount);

                    const grossPay = baseSalary + bonus + incentives;
                    const netPay = grossPay - totalDeductionAmount;

                    totalSalarySum += baseSalary;
                    totalGrossSum += grossPay;
                    totalNetSum += netPay;
                    totalDeductionsSum += totalDeductionAmount;

                    return {
                        id: employeeDetails.id || `temp-${Math.random()}`,
                        name: `${firstName} ${lastName}`.trim() || 'Unknown Employee',
                        email: email,
                        department: department,
                        salary: baseSalary,
                        bonus: bonus,
                        incentives: incentives,
                        totalDeductions: totalDeductionAmount,
                        netPay: netPay,
                        avatar: avatarUrl || generateAvatar(firstName, lastName),
                    };
                });

                setPayrollData(transformedData);
                setSummaryData({
                    totalEmployees: transformedData.length,
                    totalNet: totalNetSum.toLocaleString(),
                    totalSalary: totalSalarySum.toLocaleString(),
                    totalGross: totalGrossSum.toLocaleString(),
                    totalDeductions: totalDeductionsSum.toLocaleString(),
                });

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

    // New useEffect hook to calculate the pay period on component mount and update monthly
    useEffect(() => {
        calculatePayPeriod();

        const now = new Date();
        const msUntilNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1) - now;

        const intervalId = setInterval(() => {
            calculatePayPeriod();
        }, msUntilNextMonth);

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
            (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.salary && item.salary.toString().includes(searchTerm)) ||
            (item.bonus && item.bonus.toString().includes(searchTerm)) ||
            (item.incentives && item.incentives.toString().includes(searchTerm)) ||
            (item.totalDeductions && item.totalDeductions.toString().includes(searchTerm)) ||
            (item.netPay && item.netPay.toString().includes(searchTerm))
        );
    }, [sortedData, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key) {
            direction = sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
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
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Payroll Management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>View and manage all payroll activities in your organization</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            {/* Pay period banner with skeleton */}
            <div className='mb-10 px-5 py-7 bg-[#FDEDC5] text-center rounded-xl'>
                {loading ? (
                    <div className="animate-pulse">
                        <div className="h-4 bg-[#f5e5b3] rounded w-1/4 mx-auto mb-4"></div>
                        <div className="h-6 bg-[#f5e5b3] rounded w-1/3 mx-auto my-4"></div>
                        <div className="h-4 bg-[#f5e5b3] rounded w-1/2 mx-auto mb-4"></div>
                        <div className="h-10 bg-[#f5e5b3] rounded w-40 mx-auto"></div>
                    </div>
                ) : (
                    <>
                        <p className='text-[#A09D9D] text-[16px] font-medium'>Your next payroll is</p>
                        <p className='text-black font-medium text-xl my-4'>{payPeriod}</p>
                        <p className='text-[#A09D9D] text-[16px] font-medium'>Click prepare payroll to begin running payroll for this period</p>
                        <Link href="/humanResources/payroll/prepare-payroll" className='inline-block mt-4 bg-[#b88b1b] text-white px-6 py-2 rounded-lg hover:bg-[#b88b1b]/90 transition-colors duration-300'>Prepare Payroll</Link>
                    </>
                )}
            </div>

            {/* Summary cards with skeleton */}
            <div className='flex flex-wrap gap-4 justify-between items-center mb-10'>
                {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonPayrollCard key={`skeleton-card-${index}`} />
                    ))
                ) : (
                    <>
                        <PayrollCard title="Total employees" value={summaryData.totalEmployees} />
                        <PayrollCard title="Total gross(N)" value={summaryData.totalGross} />
                        <PayrollCard title="Total deductions(N)" value={summaryData.totalDeductions} />
                        <PayrollCard title="Total net(N)" value={summaryData.totalNet} />
                    </>
                )}
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
                            disabled={loading}
                        />
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avatar
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('name')}
                                >
                                    Name
                                    {getClassNamesFor('name') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('name') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('email')}
                                >
                                    Email
                                    {getClassNamesFor('email') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('email') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('department')}
                                >
                                    Department
                                    {getClassNamesFor('department') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('department') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('salary')}
                                >
                                    Salary
                                    {getClassNamesFor('salary') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('salary') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('bonus')}
                                >
                                    Bonus
                                    {getClassNamesFor('bonus') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('bonus') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('incentives')}
                                >
                                    Incentives
                                    {getClassNamesFor('incentives') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('incentives') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('totalDeductions')}
                                >
                                    Deductions
                                    {getClassNamesFor('totalDeductions') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('totalDeductions') === 'descending' && ' ↓'}
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => !loading && requestSort('netPay')}
                                >
                                    Net Pay
                                    {getClassNamesFor('netPay') === 'ascending' && ' ↑'}
                                    {getClassNamesFor('netPay') === 'descending' && ' ↓'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                Array.from({ length: itemsPerPage }).map((_, index) => (
                                    <SkeletonTableRow key={`skeleton-row-${index}`} />
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                        Failed to load data.
                                    </td>
                                </tr>
                            ) : currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full" src={item.avatar} alt={`${item.name}'s avatar`} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.email}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            N {item.incentives.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            N {item.totalDeductions.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            N {item.netPay.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                        No matching payroll activities found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && (
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
                                    key={`page-${number}-${index}`}
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
                )}
            </div>
        </div>
    );
}