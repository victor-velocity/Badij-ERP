"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { LeaveRow } from '@/components/employee/leave/LeaveRequestTable';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';
import RequestLeaveModal from '@/components/employee/leave/RequestLeaveModal';
import LeaveSummaryCard from '@/components/employee/leave/LeaveSummaryCard';
import { faCalendarAlt, faCheckCircle, faClock, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const SkeletonTableRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
        </td>
    </tr>
);

const useLeaveBalance = () => {
    const [balance, setBalance] = useState(null);
    useEffect(() => {
        const stored = localStorage.getItem('leave_balance') ||
            (JSON.parse(localStorage.getItem('profile') || '{}')?.leave_balance);
        setBalance(stored !== null ? Number(stored) : null);
    }, []);
    return balance;
};

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
    const leaveBalance = useLeaveBalance();

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
        setLeavesData(prev => prev.map(leave => leave.id === leaveId ? { ...leave, status: newStatus } : leave));
    };

    const handleDeleteRequest = (leaveId) => {
        setLeavesData(prev => prev.filter(leave => leave.id !== leaveId));
    };

    const handleLeaveRequestSuccess = () => {
        fetchLeaves();
    };

    const filteredLeaves = useMemo(() => {
        const list = Array.isArray(leavesData) ? leavesData : [];
        const active = list.filter(l => l?.status?.toLowerCase() !== 'cancelled');
        if (!searchTerm) return active;
        const term = searchTerm.toLowerCase();
        return active.filter(l =>
            l.employee?.first_name?.toLowerCase().includes(term) ||
            l.employee?.last_name?.toLowerCase().includes(term) ||
            l.employee?.email?.toLowerCase().includes(term) ||
            l.leave_type?.toLowerCase().includes(term) ||
            l.reason?.toLowerCase().includes(term) ||
            l.status?.toLowerCase().includes(term)
        );
    }, [searchTerm, leavesData]);

    const leaveStats = useMemo(() => {
        const list = leavesData ?? [];
        return list.reduce((s, l) => {
            const status = l?.status?.toLowerCase();
            if (status && status !== 'cancelled') {
                s.total++;
                if (status === 'pending') s.pending++;
                else if (status === 'approved') s.approved++;
                else if (status === 'rejected') s.rejected++;
            }
            return s;
        }, { total: 0, pending: 0, approved: 0, rejected: 0 });
    }, [leavesData]);

    const indexOfLastLeave = currentPage * employeesPerPage;
    const indexOfFirstLeave = indexOfLastLeave - employeesPerPage;
    const currentLeaves = filteredLeaves.slice(indexOfFirstLeave, indexOfLastLeave);
    const totalPages = Math.ceil(filteredLeaves.length / employeesPerPage);

    const paginate = (page) => setCurrentPage(page);

    const renderPaginationNumbers = () => {
        const numbers = [];
        const max = 5;
        let start = Math.max(1, currentPage - Math.floor(max / 2));
        let end = Math.min(totalPages, start + max - 1);
        if (end - start + 1 < max) start = Math.max(1, end - max + 1);

        if (start > 1) {
            numbers.push(1);
            if (start > 2) numbers.push('...');
        }
        for (let i = start; i <= end; i++) numbers.push(i);
        if (end < totalPages) {
            if (end < totalPages - 1) numbers.push('...');
            numbers.push(totalPages);
        }

        return numbers.map((n, i) => (
            <button
                key={i}
                onClick={() => typeof n === 'number' && paginate(n)}
                disabled={n === '...'}
                className={`px-4 py-2 rounded-md mx-1 text-sm font-medium transition-colors
          ${n === currentPage ? 'bg-white border border-[#b88b1b]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          ${n === '...' ? 'cursor-default bg-transparent hover:bg-transparent' : ''}`}
            >
                {n}
            </button>
        ));
    };

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const h = now.getHours();
            setGreeting(h >= 5 && h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening');
            setCurrentDateTime(now.toLocaleString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            }));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <div>
            <div>
                <div className='flex justify-between items-center mt-5 mb-10 flex-wrap gap-4'>
                    <div>
                        <h1 className='text-2xl font-bold'>Leave Requests</h1>
                        {loading ? (
                            <div className="animate-pulse mt-2"><div className="h-4 bg-gray-200 rounded w-48"></div></div>
                        ) : (
                            <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                        )}
                    </div>
                    <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                        {currentDateTime}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                    <LeaveSummaryCard title="Total Requests" count={leaveStats.total} icon={faCalendarAlt} iconColor="text-blue-600" backgroundColor="bg-blue-50" />
                    <LeaveSummaryCard title="Approved" count={leaveStats.approved} icon={faCheckCircle} iconColor="text-green-600" backgroundColor="bg-green-50" />
                    <LeaveSummaryCard title="Pending" count={leaveStats.pending} icon={faClock} iconColor="text-yellow-600" backgroundColor="bg-yellow-50" />
                    <LeaveSummaryCard title="Rejected" count={leaveStats.rejected} icon={faTimesCircle} iconColor="text-red-600" backgroundColor="bg-red-50" />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    {loading ? (
                        <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-48 mb-4 sm:mb-0"></div></div>
                    ) : (
                        <div className="text-lg font-semibold text-gray-800">
                            Available Leave:{' '}
                            <span className="text-[#b88b1b] font-bold">
                                {leaveBalance !== null ? `${leaveBalance} day${leaveBalance !== 1 ? 's' : ''}` : '–'}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto mt-4 sm:mt-0">
                        {/* <div className="relative w-full sm:w-64">
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
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </>
                            )}
                        </div> */}

                        {loading ? (
                            <div className="px-6 py-2 rounded-md bg-gray-200 animate-pulse w-full sm:w-auto">
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
                    <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved by</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Array.from({ length: employeesPerPage }).map((_, i) => <SkeletonTableRow key={i} />)}
                            </tbody>
                        </table>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500">{error}</div>
                ) : filteredLeaves.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No leave requests found.</div>
                ) : (
                    <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved by</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:text-white hover:bg-[#b88b1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            &lt;
                        </button>
                        {renderPaginationNumbers()}
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:text-white hover:bg-[#b88b1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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