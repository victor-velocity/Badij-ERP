"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LeaveRow } from '@/components/hr/leave/LeaveRequestTable';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faHourglassHalf,
    faCheckCircle,
    faTimesCircle,
    faClipboardList
} from '@fortawesome/free-solid-svg-icons';

// --- MetricCard Component (Text-Left, Icon-Right Layout) ---
const MetricCard = ({ title, value, icon, bgColor, textColor }) => (
    <div className={`flex flex-col px-5 py-7 rounded-xl shadow-lg border-l-4 ${bgColor} min-w-[200px] flex-1 transition-transform hover:scale-[1.02]`}>
        <div className="flex justify-between items-start w-full">
            <div className='flex flex-col items-start'>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className={`text-3xl font-bold mt-1 ${textColor.replace('text', 'text')}`}>{value}</p>
            </div>
            <div className={`p-3 rounded-full ${textColor} ${bgColor.replace('-50', '-100')}`}>
                <FontAwesomeIcon icon={icon} className="text-2xl" />
            </div>
        </div>
    </div>
);
// --- End MetricCard Component ---


const LeaveRequestTable = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 15;
    const [currentDateTime, setCurrentDateTime] = useState('');

    const [leavesData, setLeavesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // --- Metric States ---
    const [totalRequests, setTotalRequests] = useState(0);
    const [pendingRequests, setPendingRequests] = useState(0);
    const [approvedRequests, setApprovedRequests] = useState(0);
    const [rejectedRequests, setRejectedRequests] = useState(0);
    // ---------------------

    // --- Metric Calculation Logic ---
    const calculateMetrics = useCallback((data) => {
        if (!data) return;

        // Filter out 'cancelled' requests for metrics
        const activeLeaves = data.filter(leave => leave.status?.toLowerCase() !== 'cancelled');

        const total = activeLeaves.length;
        const pending = activeLeaves.filter(leave => leave.status?.toLowerCase() === 'pending').length;
        const approved = activeLeaves.filter(leave => leave.status?.toLowerCase() === 'approved').length;
        const rejected = activeLeaves.filter(leave => leave.status?.toLowerCase() === 'rejected').length;

        setTotalRequests(total);
        setPendingRequests(pending);
        setApprovedRequests(approved);
        setRejectedRequests(rejected);
    }, []);
    // --------------------------------

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getLeaves();
            setLeavesData(data);
            calculateMetrics(data); // Calculate metrics after fetching data
        } catch (err) {
            console.error("Error fetching leave requests:", err);
            setError("Failed to load leave requests. Please try again.");
            toast.error("Failed to load leave requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [refreshTrigger, calculateMetrics]);

    const handleUpdateLeaveStatus = (leaveId, newStatus) => {
        setLeavesData(prevLeaves =>
            prevLeaves.map(leave => {
                if (leave.id === leaveId) {
                    return { ...leave, status: newStatus };
                }
                return leave;
            })
        );
        
        setTimeout(() => {
            setRefreshTrigger(prev => prev + 1);
        }, 500);
    };

    const filteredLeaves = useMemo(() => {
        const activeLeaves = leavesData.filter(leave => leave.status !== 'cancelled');

        if (!searchTerm) {
            return activeLeaves;
        }

        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return activeLeaves.filter(leave =>
            (leave.employee?.first_name && leave.employee.first_name.toLowerCase().includes(lowercasedSearchTerm)) ||
            (leave.employee?.last_name && leave.employee.last_name.toLowerCase().includes(lowercasedSearchTerm)) ||
            (leave.employee?.email && leave.employee.email.toLowerCase().includes(lowercasedSearchTerm)) ||
            (leave.leave_type && leave.leave_type.toLowerCase().includes(lowercasedSearchTerm)) ||
            (leave.reason && leave.reason.toLowerCase().includes(lowercasedSearchTerm)) ||
            (leave.status && leave.status.toLowerCase().includes(lowercasedSearchTerm))
        );
    }, [searchTerm, leavesData]);

    const indexOfLastLeave = currentPage * employeesPerPage;
    const indexOfFirstLeave = indexOfLastLeave - employeesPerPage;
    const currentLeaves = filteredLeaves.slice(indexOfFirstLeave, indexOfLastLeave);
    const totalPages = Math.ceil(filteredLeaves.length / employeesPerPage);

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

    const LoadingSkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap rounded-l-lg">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="ml-4">
                        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-32"></div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-8 bg-gray-300 rounded-full w-20"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap rounded-r-lg">
                <div className="h-4 bg-gray-300 rounded w-24"></div>
            </td>
        </tr>
    );

    const TableHeader = () => (
        <thead>
            <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved by</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
            </tr>
        </thead>
    );

    return (
        <div className="">
            <div className="">
                <div className='flex justify-between items-center mt-5 mb-10 flex-wrap gap-4'>
                    <div>
                        <h1 className='text-2xl font-bold '>Leave Request Management</h1>
                        <p className='text-[#A09D9D] font-medium mt-2'>View and manage all leave requests in your organization</p>
                    </div>
                    <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                        {currentDateTime}
                    </span>
                </div>

                {/* --- Metric Cards Section --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <MetricCard 
                        title="Total Requests"
                        value={loading ? '...' : totalRequests.toString()}
                        icon={faClipboardList}
                        bgColor="bg-indigo-50"
                        textColor="text-indigo-700"
                    />
                    <MetricCard 
                        title="Pending"
                        value={loading ? '...' : pendingRequests.toString()}
                        icon={faHourglassHalf}
                        bgColor="bg-yellow-50"
                        textColor="text-yellow-700"
                    />
                    <MetricCard 
                        title="Approved"
                        value={loading ? '...' : approvedRequests.toString()}
                        icon={faCheckCircle}
                        bgColor="bg-green-50"
                        textColor="text-green-700"
                    />
                    <MetricCard 
                        title="Rejected"
                        value={loading ? '...' : rejectedRequests.toString()}
                        icon={faTimesCircle}
                        bgColor="bg-red-50"
                        textColor="text-red-700"
                    />
                </div>
                {/* --- End Metric Cards Section --- */}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Leave list</h2>
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
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200 table-container">
                    <table className="min-w-full divide-y divide-gray-200 bg-white">
                        <TableHeader />
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                Array.from({ length: employeesPerPage }).map((_, index) => (
                                    <LoadingSkeletonRow key={index} />
                                ))
                            ) : error ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center">
                                        <div className="text-red-500 font-medium">{error}</div>
                                        <button 
                                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            Try Again
                                        </button>
                                    </td>
                                </tr>
                            ) : filteredLeaves.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                                        No leave requests found.
                                    </td>
                                </tr>
                            ) : (
                                currentLeaves.map(leave => (
                                    <LeaveRow 
                                        key={leave.id} 
                                        leaveRequest={leave} 
                                        onUpdateStatus={handleUpdateLeaveStatus} 
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredLeaves.length > 0 && (
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