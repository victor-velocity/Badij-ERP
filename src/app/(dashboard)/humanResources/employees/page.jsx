"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiService from "@/app/lib/apiService";
import AddEmployeeModal from '@/components/hr/employees/AddEmployee';
import EmployeeDetailModal from '@/components/hr/employees/EmployeeDetails';
import EditEmployeeModal from '@/components/hr/employees/EditEmployee';
import EmployeeRow from '@/components/hr/employees/EmployeeListTable';
import DeleteEmployeeModal from '@/components/hr/employees/DeleteEmployeeModal';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUsers, 
    faUserCheck, 
    faPlaneDeparture, 
    faUserPlus 
} from '@fortawesome/free-solid-svg-icons';

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

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="ml-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="mt-2 h-3 bg-gray-200 rounded w-32"></div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-28"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
        </td>
    </tr>
);

const EmployeeListTable = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [employees, setEmployees] = useState([]);
    const [error, setError] = useState(null);
    const [_successMessage, _setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const employeesPerPage = 10;
    const [currentDateTime, setCurrentDateTime] = useState('');

    const [totalEmployees, setTotalEmployees] = useState(0);
    const [activeEmployees, setActiveEmployees] = useState(0);
    const [onLeaveEmployees, setOnLeaveEmployees] = useState(0);
    const [newHiresLast30Days, setNewHiresLast30Days] = useState(0);


    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [isViewEmployeeModalOpen, setIsViewEmployeeModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
    const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState(null);

    const [isDeleteEmployeeModalOpen, setIsDeleteEmployeeModalOpen] = useState(false);
    const [selectedEmployeeForDelete, setSelectedEmployeeForDelete] = useState(null);

    const calculateMetrics = useCallback((data) => {
        if (!data) return;

        const nonTerminatedEmployees = data.filter(emp => 
            emp.employment_status?.toLowerCase() !== 'terminated'
        );

        const total = nonTerminatedEmployees.length;
        const active = nonTerminatedEmployees.filter(emp => emp.employment_status?.toLowerCase() === 'active').length;
        const onLeave = nonTerminatedEmployees.filter(emp => emp.employment_status?.toLowerCase() === 'on leave').length;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const newHires = nonTerminatedEmployees.filter(emp => {
            if (!emp.hire_date) return false;
            const hireDate = new Date(emp.hire_date);
            return hireDate >= thirtyDaysAgo;
        }).length;

        setTotalEmployees(total);
        setActiveEmployees(active);
        setOnLeaveEmployees(onLeave);
        setNewHiresLast30Days(newHires);
    }, []);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getEmployees(router);
            setEmployees(data || []);
            calculateMetrics(data);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError(`Failed to fetch employees: ${err.message}. Please check your connection and authentication.`);
        } finally {
            setLoading(false);
        }
    }, [router, calculateMetrics]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleEdit = (employeeData) => {
        setSelectedEmployeeForEdit(employeeData);
        setIsEditEmployeeModalOpen(true);
    };

    const handleView = (employeeData) => {
        setSelectedEmployee(employeeData);
        setIsViewEmployeeModalOpen(true);
    };

    const handleDelete = (employeeData) => {
        setSelectedEmployeeForDelete(employeeData);
        setIsDeleteEmployeeModalOpen(true);
    };

    const handleEmployeeAdded = () => {
        fetchEmployees();
        setIsAddEmployeeModalOpen(false);
        toast.success('New employee added successfully!');
    };

    const handleEmployeeUpdated = () => {
        fetchEmployees();
        setIsEditEmployeeModalOpen(false);
        toast.success('Employee details updated successfully!');
    };

    const handleEmployeeDeleted = () => {
        fetchEmployees();
        setIsDeleteEmployeeModalOpen(false);
    };

    const sortedAndFilteredEmployees = useMemo(() => {
        let filtered = employees;

        filtered = filtered.filter(employee =>
            employee.employment_status?.toLowerCase() !== 'terminated'
        );

        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(employee =>
                employee.first_name?.toLowerCase().includes(lowercasedSearchTerm) ||
                employee.last_name?.toLowerCase().includes(lowercasedSearchTerm) ||
                employee.email?.toLowerCase().includes(lowercasedSearchTerm) ||
                employee.phone_number?.includes(lowercasedSearchTerm)
            );
        }

        return [...filtered].sort((a, b) => {
            const nameA = a.first_name?.toLowerCase() || '';
            const nameB = b.first_name?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        });
    }, [searchTerm, employees]);

    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = sortedAndFilteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);
    const totalPages = Math.ceil(sortedAndFilteredEmployees.length / employeesPerPage);

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

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-10 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Employee Directory</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization’s teams</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <MetricCard 
                    title="Total Employees"
                    value={loading ? '...' : totalEmployees.toString()}
                    icon={faUsers}
                    bgColor="bg-blue-50"
                    textColor="text-blue-700"
                />
                <MetricCard 
                    title="Active Employees"
                    value={loading ? '...' : activeEmployees.toString()}
                    icon={faUserCheck}
                    bgColor="bg-green-50"
                    textColor="text-green-700"
                />
                <MetricCard 
                    title="On Leave"
                    value={loading ? '...' : onLeaveEmployees.toString()}
                    icon={faPlaneDeparture}
                    bgColor="bg-yellow-50"
                    textColor="text-yellow-700"
                />
                <MetricCard 
                    title="New Hires (30 Days)"
                    value={loading ? '...' : newHiresLast30Days.toString()}
                    icon={faUserPlus}
                    bgColor="bg-purple-50"
                    textColor="text-purple-700"
                />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-6">
                <h2 className="text-2xl font-semibold text-gray-800">Employee List</h2>
                <div className="flex items-center space-x-4 w-full sm:w-auto flex-wrap gap-4">
                    <div className='flex flex-nowrap gap-2 items-center'>
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsAddEmployeeModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-[#b88b1b] text-white rounded-lg hover:bg-[#997417] transition-colors shadow-md cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add employee
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            {loading ? (
                <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 bg-white">
                        <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile no</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of birth</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {Array.from({ length: employeesPerPage }).map((_, index) => (
                                <SkeletonRow key={index} />
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : sortedAndFilteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No employees found matching your search.</div>
            ) : (
                <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 bg-white">
                        <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile no</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of birth</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentEmployees.map(employee => (
                                <EmployeeRow
                                    key={employee.id}
                                    employee={employee}
                                    onEdit={handleEdit}
                                    onView={handleView}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {sortedAndFilteredEmployees.length > 0 && !loading && (
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
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:text-white hover:bg-[#b88b1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        &gt;
                    </button>
                </div>
            )}

            <AddEmployeeModal
                isOpen={isAddEmployeeModalOpen}
                onClose={() => setIsAddEmployeeModalOpen(false)}
                onEmployeeAdded={handleEmployeeAdded}
                router={router}
            />

            <EmployeeDetailModal
                isOpen={isViewEmployeeModalOpen}
                onClose={() => setIsViewEmployeeModalOpen(false)}
                employee={selectedEmployee}
                router={router}
            />

            <EditEmployeeModal
                isOpen={isEditEmployeeModalOpen}
                onClose={() => setIsEditEmployeeModalOpen(false)}
                onEmployeeUpdated={handleEmployeeUpdated}
                employee={selectedEmployeeForEdit}
                router={router}
            />

            <DeleteEmployeeModal
                isOpen={isDeleteEmployeeModalOpen}
                onClose={() => setIsDeleteEmployeeModalOpen(false)}
                employee={selectedEmployeeForDelete}
                onEmployeeDeleted={handleEmployeeDeleted}
                router={router}
            />
        </div>
    );
};

export default EmployeeListTable;