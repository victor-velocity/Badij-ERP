"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiService from "@/app/lib/apiService";
import AddEmployeeModal from '@/components/hr/employees/AddEmployee';
import EmployeeDetailModal from '@/components/hr/employees/EmployeeDetails';
import EditEmployeeModal from '@/components/hr/employees/EditEmployee';
import EmployeeRow from '@/components/hr/employees/EmployeeListTable';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const EmployeeListTable = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, _setSuccessMessage] = useState('');
    const employeesPerPage = 10;
    const [currentDateTime, setCurrentDateTime] = useState('');

    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
    const [isViewEmployeeModalOpen, setIsViewEmployeeModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
    const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState(null);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.getEmployees(router);
            setEmployees(data || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError(`Failed to fetch employees: ${err.message}. Please check your connection and authentication.`);
        } finally {
            setLoading(false);
        }
    }, [router]);

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


    const filteredEmployees = useMemo(() => {
        if (!searchTerm) {
            return employees;
        }
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        return employees.filter(employee =>
            employee.first_name?.toLowerCase().includes(lowercasedSearchTerm) ||
            employee.last_name?.toLowerCase().includes(lowercasedSearchTerm) ||
            employee.email?.toLowerCase().includes(lowercasedSearchTerm) ||
            employee.phone_number?.includes(lowercasedSearchTerm)
        );
    }, [searchTerm, employees]);

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
        <div className="max-w-[1400px] mx-auto">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Employee directory page</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization’s teams</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-6">
                <h2 className="text-2xl font-semibold text-gray-800">Employee list</h2>
                <div className="flex items-center space-x-4 w-full sm:w-auto flex-wrap gap-4">
                    <div className='flex flex-nowrap gap-2 items-center'>
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Success!</strong>
                    <span className="block sm:inline"> {successMessage}</span>
                </div>
            )}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading employees...</div>
            ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No employees found matching your search.</div>
            ) : (
                <div className="overflow-x-auto shadow-md sm:rounded-lg rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 bg-white">
                        <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile no</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
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
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:text-white hover:bg-[#b88b1b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        &gt;
                    </button>
                </div>
            )}

            {/* Add Employee Multi-Step Modal */}
            <AddEmployeeModal
                isOpen={isAddEmployeeModalOpen}
                onClose={() => setIsAddEmployeeModalOpen(false)}
                onEmployeeAdded={handleEmployeeAdded}
                router={router}
            />

            {/* Employee Detail Modal */}
            <EmployeeDetailModal
                isOpen={isViewEmployeeModalOpen}
                onClose={() => setIsViewEmployeeModalOpen(false)}
                employee={selectedEmployee}
                router={router}
            />

            {/* Edit Employee Modal */}
            <EditEmployeeModal
                isOpen={isEditEmployeeModalOpen}
                onClose={() => setIsEditEmployeeModalOpen(false)}
                onEmployeeUpdated={handleEmployeeUpdated}
                employee={selectedEmployeeForEdit}
                router={router}
            />
        </div>
    );
};

export default EmployeeListTable;