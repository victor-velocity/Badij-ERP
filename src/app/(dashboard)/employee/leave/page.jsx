"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LeaveRow } from '@/components/employee/leave/LeaveRequestTable';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';
import RequestLeaveModal from '@/components/employee/leave/RequestLeaveModal';

// Skeleton Loading Components
const SkeletonTableRow = () => (
  <tr className="animate-pulse">
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
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex space-x-2">
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </td>
  </tr>
);

const LeaveRequests = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const employeesPerPage = 10;
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [leavesData, setLeavesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const first_name = typeof window !== 'undefined' ? localStorage.getItem('first_name') : '';

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getLeaves();
            if (data && data.message === "No leave requests found") {
                setLeavesData([]);
            } else {
                setLeavesData(data);
            }
        } catch (err) {
            console.error("Error fetching leave requests:", err);
            if (err.message === "No leave requests found") {
                setLeavesData([]);
            } else {
                setError("Failed to load leave requests. Please try again.");
                toast.error("Failed to load leave requests.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleUpdateLeaveStatus = (leaveId, newStatus) => {
        setLeavesData(prevLeaves =>
            prevLeaves.map(leave => {
                if (leave.id === leaveId) {
                    return { ...leave, status: newStatus };
                }
                return leave;
            })
        );
    };

    const handleDeleteRequest = (leaveId) => {
        setLeavesData(prevLeaves => prevLeaves.filter(leave => leave.id !== leaveId));
    };

    const handleLeaveRequestSuccess = () => {
        fetchLeaves();
    };

    const filteredLeaves = useMemo(() => {
        const nonCancelledLeaves = leavesData.filter(
            leave => leave.status.toLowerCase() !== 'cancelled'
        );

        if (!searchTerm) {
            return nonCancelledLeaves;
        }

        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return nonCancelledLeaves.filter(leave =>
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
        <div className="">
            <div className="">
                <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                    <div>
                        <h1 className='text-2xl font-bold '>Leave Requests</h1>
                        {loading ? (
                            <div className="animate-pulse mt-2">
                                <div className="h-4 bg-gray-200 rounded w-48"></div>
                            </div>
                        ) : (
                            <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                        )}
                    </div>
                    <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                        {currentDateTime}
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    {loading ? (
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-32 mb-4 sm:mb-0"></div>
                        </div>
                    ) : (
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Leave list</h2>
                    )}
                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            {loading ? (
                                <div className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded"></div>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                        {loading ? (
                            <div className="px-6 py-2 rounded-md bg-gray-200 font-medium w-full sm:w-auto animate-pulse">
                                <div className="h-6 bg-gray-300 rounded"></div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-2 rounded-md bg-[#b88b1b] text-white font-medium hover:bg-[#a07a16] transition-colors w-full sm:w-auto"
                            >
                                Request New Leave
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200 table-container">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved by</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Array.from({ length: employeesPerPage }).map((_, index) => (
                                    <SkeletonTableRow key={index} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">{error}</div>
                ) : filteredLeaves.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No leave requests found.</div>
                ) : (
                    <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200 table-container">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead>
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved by</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentLeaves.map(leave => (
                                    <LeaveRow
                                        key={leave.id}
                                        leaveRequest={leave}
                                        onUpdateStatus={handleUpdateLeaveStatus}
                                        onDeleteRequest={handleDeleteRequest}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

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

            <RequestLeaveModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleLeaveRequestSuccess}
            />
        </div>
    );
};

export default LeaveRequests;