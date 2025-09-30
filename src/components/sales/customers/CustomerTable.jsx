"use client"

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
import AddCustomerModal from "./AddCustomer";
import EditCustomerModal from "./EditCustomerModal";
import apiService from "@/app/lib/apiService";

const CustomerListTable = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [employeeNames, setEmployeeNames] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const itemsPerPage = 5;

    useEffect(() => {
        const fetchCustomers = async () => {
            setIsLoading(true);
            try {
                const response = await apiService.getCustomers(null);
                const customerData = response.data || [];

                // Fetch employee names for updated_by
                const employeeIds = [...new Set(customerData
                    .map(customer => customer.updated_by)
                    .filter(id => id !== null))];
                const employeePromises = employeeIds.map(id =>
                    apiService.getEmployeeById(id, null)
                        .then(res => ({ id, name: `${res.data.first_name} ${res.data.last_name}` }))
                        .catch(() => ({ id, name: '-' }))
                );
                const employeeResults = await Promise.all(employeePromises);
                const employeeMap = Object.fromEntries(employeeResults.map(({ id, name }) => [id, name]));

                setCustomers(customerData);
                setEmployeeNames(employeeMap);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'text-green-500';
            case 'inactive':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Lagos'
        });
    };

    const filteredCustomers = customers.filter(customer =>
        (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (customer.state?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (customer.status?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (employeeNames[customer.updated_by]?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCustomers = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Skeleton loading component
    const SkeletonRow = () => (
        <tr className="border-b border-gray-300 animate-pulse">
            <td className="py-5 px-4 min-w-[150px]"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="py-5 px-4 min-w-[130px]"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
            <td className="py-5 px-4 min-w-[180px]"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
            <td className="py-5 px-4 min-w-[150px]"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="py-5 px-4 min-w-[100px]"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
            <td className="py-5 px-4 min-w-[100px]"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
            <td className="py-5 px-4 min-w-[150px]"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
            <td className="py-5 px-4 min-w-[150px]"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
            <td className="py-5 px-4 min-w-[100px]"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
            <td className="py-5 px-4 min-w-[100px]"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
        </tr>
    );

    return (
        <div className="rounded-lg shadow-md p-4">
            {error && (
                <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Customer list table</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search customers"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] min-w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 bg-[#b88b1b] hover:bg-[#886817] transition-all text-white rounded-md whitespace-nowrap"
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add Customer
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-600 text-sm border-b border-gray-300">
                            <th className="pb-4 pt-2 px-4 min-w-[150px]">Customer name</th>
                            <th className="pb-4 pt-2 px-4 min-w-[130px]">Phone number</th>
                            <th className="pb-4 pt-2 px-4 min-w-[180px]">Email</th>
                            <th className="pb-4 pt-2 px-4 min-w-[150px]">Address</th>
                            <th className="pb-4 pt-2 px-4 min-w-[100px]">State</th>
                            <th className="pb-4 pt-2 px-4 min-w-[100px]">Status</th>
                            <th className="pb-4 pt-2 px-4 min-w-[150px]">Created At</th>
                            <th className="pb-4 pt-2 px-4 min-w-[150px]">Updated At</th>
                            <th className="pb-4 pt-2 px-4 min-w-[100px]">Updated By</th>
                            <th className="pb-4 pt-2 px-4 min-w-[100px]">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: itemsPerPage }).map((_, index) => (
                                <SkeletonRow key={index} />
                            ))
                        ) : currentCustomers.length > 0 ? (
                            currentCustomers.map((customer) => (
                                <tr key={customer.customer_id} className="border-b border-gray-300">
                                    <td className="py-5 px-4 min-w-[150px] whitespace-nowrap">{customer.name}</td>
                                    <td className="py-5 px-4 min-w-[130px] whitespace-nowrap">{customer.phone || '-'}</td>
                                    <td className="py-5 px-4 min-w-[180px] whitespace-nowrap">{customer.email}</td>
                                    <td className="py-5 px-4 min-w-[150px] whitespace-nowrap">{customer.address || '-'}</td>
                                    <td className="py-5 px-4 min-w-[100px] whitespace-nowrap">{customer.state || '-'}</td>
                                    <td className="py-5 px-4 min-w-[100px] whitespace-nowrap">
                                        <span className={getStatusColor(customer.status)}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="py-5 px-4 min-w-[150px] whitespace-nowrap">{formatDate(customer.created_at)}</td>
                                    <td className="py-5 px-4 min-w-[150px] whitespace-nowrap">{formatDate(customer.updated_at)}</td>
                                    <td className="py-5 px-4 min-w-[100px] whitespace-nowrap">{employeeNames[customer.updated_by] || '-'}</td>
                                    <td className="py-5 px-4 min-w-[100px] flex space-x-4">
                                        <FontAwesomeIcon
                                            icon={faEdit}
                                            className="text-blue-500 hover:text-blue-600 transition-all cursor-pointer"
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setIsEditModalOpen(true);
                                            }}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="10" className="py-5 px-4 text-center text-gray-500">
                                    No customers found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-6 mb-3 flex justify-center items-center gap-2 flex-wrap">
                <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="px-3 py-1 bg-[#b88b1b] text-white rounded-md disabled:opacity-50 whitespace-nowrap"
                >
                    Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                        key={page}
                        onClick={() => paginate(page)}
                        disabled={isLoading}
                        className={`px-3 py-1 mx-1 rounded-md ${currentPage === page ? 'bg-[#b88b1b] text-white' : 'bg-gray-200 text-gray-700'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="px-3 py-1 bg-[#b88b1b] text-white rounded-md disabled:opacity-50 whitespace-nowrap"
                >
                    Next
                </button>
            </div>

            <AddCustomerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    // Refresh customers after adding
                    setIsLoading(true);
                    apiService.getCustomers(null).then(response => {
                        const customerData = response.data || [];
                        const employeeIds = [...new Set(customerData
                            .map(customer => customer.updated_by)
                            .filter(id => id !== null))];
                        Promise.all(employeeIds.map(id =>
                            apiService.getEmployeeById(id, null)
                                .then(res => ({ id, name: `${res.data.first_name} ${res.data.last_name}` }))
                                .catch(() => ({ id, name: '-' }))
                        )).then(employeeResults => {
                            const employeeMap = Object.fromEntries(employeeResults.map(({ id, name }) => [id, name]));
                            setCustomers(customerData);
                            setEmployeeNames(employeeMap);
                            setError(null);
                        }).catch(err => {
                            setError(err.message);
                        }).finally(() => {
                            setIsLoading(false);
                        });
                    }).catch(err => {
                        setError(err.message);
                        setIsLoading(false);
                    });
                }}
            />
            <EditCustomerModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    // Refresh customers after updating
                    setIsLoading(true);
                    apiService.getCustomers(null).then(response => {
                        const customerData = response.data || [];
                        const employeeIds = [...new Set(customerData
                            .map(customer => customer.updated_by)
                            .filter(id => id !== null))];
                        Promise.all(employeeIds.map(id =>
                            apiService.getEmployeeById(id, null)
                                .then(res => ({ id, name: `${res.data.first_name} ${res.data.last_name}` }))
                                .catch(() => ({ id, name: '-' }))
                        )).then(employeeResults => {
                            const employeeMap = Object.fromEntries(employeeResults.map(({ id, name }) => [id, name]));
                            setCustomers(customerData);
                            setEmployeeNames(employeeMap);
                            setError(null);
                        }).catch(err => {
                            setError(err.message);
                        }).finally(() => {
                            setIsLoading(false);
                        });
                    }).catch(err => {
                        setError(err.message);
                        setIsLoading(false);
                    });
                }}
                customer={selectedCustomer}
            />
        </div>
    );
};

export default CustomerListTable;