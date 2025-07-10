"use client"

import Link from 'next/link';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from "@/app/lib/supabase/client"; // Your local Supabase client import
import { useRouter } from 'next/navigation'; // Import useRouter for navigation

const supabase = createClient(); // Initialize your Supabase client

const DEFAULT_AVATAR = 'https://placehold.co/40x40/cccccc/000000?text=👤';

const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options).replace(/(\w+) (\d+), (\d+)/, '$2 of $1 $3');
};

const EmployeeRow = ({ employee, onEdit, onDelete }) => { // Added onEdit and onDelete props
    const [imgSrc, setImgSrc] = useState(employee.avatar || DEFAULT_AVATAR);

    const handleImageError = () => {
        setImgSrc(DEFAULT_AVATAR);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Probation':
                return 'bg-yellow-100 text-yellow-800';
            case 'Transferred':
                return 'bg-blue-100 text-blue-800';
            case 'Terminated':
                return 'bg-red-100 text-red-800';
            case 'On Leave':
                return 'bg-orange-100 text-orange-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <tr className="hover:bg-gray-50">
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
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.phone_number || '—'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.position || 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(employee.date_of_birth)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(employee.hire_date)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.employment_status)}`}>
                    {employee.employment_status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                    onClick={() => onEdit(employee.id)} // Call onEdit with employee ID
                    className="text-blue-600 hover:text-blue-800 mr-2 p-1 rounded-md hover:bg-blue-50"
                    title="Edit"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.38-2.828-2.829z" />
                    </svg>
                </button>
                <button
                    onClick={() => onDelete(employee.id)} // Call onDelete with employee ID
                    className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"
                    title="Delete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 01-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                    </svg>
                </button>
            </td>
        </tr>
    );
};

const EmployeeListTable = () => {
    const router = useRouter(); // Initialize useRouter
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(''); // State for success messages
    const employeesPerPage = 10;
    const [currentDateTime, setCurrentDateTime] = useState('');

    // Function to fetch employees from Supabase
    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
            .from('employees')
            .select('*');

        if (error) {
            console.error("Error fetching employees:", error);
            setError("Failed to fetch employees. Please try again.");
        } else {
            console.log("Supabase data fetched:", data);
            setEmployees(data || []);
        }
        setLoading(false);
    }, []); // Empty dependency array means this function is created once

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]); // Re-fetch when fetchEmployees function changes (rarely, due to useCallback)

    const handleEdit = (id) => {
        router.push(`/humanResources/employees/edit/${id}`); // Navigate to an edit page for the specific employee
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
            return; // User cancelled the deletion
        }

        setLoading(true);
        setSuccessMessage('');
        setError(null);

        try {
            const { error } = await supabase
                .from('employees')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting employee:', error);
                setError(`Failed to delete employee: ${error.message}`);
            } else {
                setSuccessMessage('Employee deleted successfully!');
                fetchEmployees(); // Re-fetch employees to update the list
                setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
            }
        } catch (err) {
            console.error('Unexpected error during deletion:', err);
            setError('An unexpected error occurred during deletion.');
        } finally {
            setLoading(false);
        }
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
            employee.phone_number?.includes(lowercasedSearchTerm) ||
            employee.position?.toLowerCase().includes(lowercasedSearchTerm) ||
            employee.employment_status?.toLowerCase().includes(lowercasedSearchTerm)
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
            <div className='flex justify-between items-center mt-5 mb-14'>
                <div>
                    <h1 className='text-2xl font-bold '>Employee directory page</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>Manage and collaborate within your organization’s teams</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-semibold text-gray-800">Employee list</h2>
                <div className="flex items-center space-x-4 w-full sm:w-auto">
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
                    <button
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Filter"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 9.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <Link href="employees/add">
                        <button className="flex items-center px-4 py-2 bg-[#b88b1b] text-white rounded-lg hover:bg-[#997417] transition-colors shadow-md cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add employee
                        </button>
                    </Link>
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of birth</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentEmployees.map(employee => (
                                <EmployeeRow
                                    key={employee.id}
                                    employee={employee}
                                    onEdit={handleEdit} // Pass handleEdit to EmployeeRow
                                    onDelete={handleDelete} // Pass handleDelete to EmployeeRow
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
        </div>
    );
};

export default EmployeeListTable;