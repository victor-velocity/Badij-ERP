"use client"

import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

const ReportsPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [employeeMap, setEmployeeMap] = useState({});
    const [batchMap, setBatchMap] = useState({});
    const [supplierMap, setSupplierMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDetails, setSelectedDetails] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        type: '',
        batch_number: '',
        created_by: '',
        start_date: '',
        end_date: ''
    });
    const router = useRouter();

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const query = {
                    page: currentPage,
                    limit: itemsPerPage,
                    ...filters
                };
                const response = await apiService.getInventoryTransactions(router, query);
                if (response.status === "success") {
                    let data = response.data || [];
                    data.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));

                    const uniqueEmployeeIds = new Set(data.map(t => t.created_by));
                    const employeePromises = [...uniqueEmployeeIds].map(id => 
                        apiService.getEmployeeById(id, router).then(emp => ({ id, emp }))
                    );
                    const employees = await Promise.all(employeePromises);
                    const empMap = employees.reduce((map, { id, emp }) => {
                        map[id] = emp;
                        return map;
                    }, {});
                    setEmployeeMap(empMap);

                    const uniqueBatchIds = new Set(data.filter(t => t.batch_id).map(t => t.batch_id));
                    const batchPromises = [...uniqueBatchIds].map(id => 
                        apiService.getImportBatchById(id, router).then(b => ({ id, batch: b.data[0] }))
                    );
                    const batches = await Promise.all(batchPromises);
                    const batMap = batches.reduce((map, { id, batch }) => {
                        map[id] = batch;
                        return map;
                    }, {});
                    setBatchMap(batMap);

                    const uniqueSupplierIds = new Set(Object.values(batMap).filter(b => b && b.supplier_id).map(b => b.supplier_id));
                    const supplierPromises = [...uniqueSupplierIds].map(id => 
                        apiService.getSupplierById(id, router).then(s => ({ id, supplier: s.data[0] }))
                    );
                    const suppliers = await Promise.all(supplierPromises);
                    const supMap = suppliers.reduce((map, { id, supplier }) => {
                        map[id] = supplier;
                        return map;
                    }, {});
                    setSupplierMap(supMap);

                    data = data.map(t => ({
                        ...t,
                        created_by_name: empMap[t.created_by] ? `${empMap[t.created_by].first_name} ${empMap[t.created_by].last_name}` : t.created_by,
                        batch_number: t.batch_id ? (batMap[t.batch_id]?.batch_number || t.batch_id) : 'N/A'
                    }));

                    setTransactions(data);
                    setTotalPages(response.pagination?.totalPages || Math.ceil(data.length / itemsPerPage));
                    toast.success("Inventory transactions fetched successfully!");
                } else {
                    setError(response.message || "Failed to fetch inventory transactions");
                    toast.error(response.message || "Failed to fetch inventory transactions");
                }
            } catch (error) {
                console.error("Error fetching inventory transactions:", error);
                setError(error.message || "An unexpected error occurred");
                toast.error(error.message || "An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [router, currentPage, itemsPerPage, filters]);

    const handleViewMore = (transaction) => {
        const employee = employeeMap[transaction.created_by];
        const batch = batchMap[transaction.batch_id];
        const supplier = batch && batch.supplier_id ? supplierMap[batch.supplier_id] : null;
        setSelectedDetails({ transaction, employee, batch, supplier });
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const first_name = typeof window !== 'undefined' ? localStorage.getItem('first_name') : '';

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
        <div>
            <div className='flex justify-between items-center mt-5 mb-10 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Inventory Transactions Report</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="mb-10 p-7 rounded-lg shadow-md border-solid border border-[#e8e8e8]">
                <h3 className="text-lg font-semibold mb-4">Filter Transactions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-[#e8e8e8] border border-solid shadow-sm focus:border-[#b88b1b] focus:ring-1 focus:ring-[#b88b1b] px-3 py-3 focus:ring-opacity-50"
                        >
                            <option value="">All Types</option>
                            <option value="inbound">Inbound</option>
                            <option value="outbound">Outbound</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                        <input
                            type="text"
                            name="batch_number"
                            value={filters.batch_number}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-[#e8e8e8] border border-solid shadow-sm focus:border-[#b88b1b] focus:ring-1 focus:ring-[#b88b1b] px-3 py-3 focus:ring-opacity-50"
                            placeholder="Enter batch number"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Created By</label>
                        <input
                            type="text"
                            name="created_by"
                            value={filters.created_by}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-[#e8e8e8] border border-solid shadow-sm focus:border-[#b88b1b] focus:ring-1 focus:ring-[#b88b1b] px-3 py-3 focus:ring-opacity-50"
                            placeholder="Enter employee name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-[#e8e8e8] border border-solid shadow-sm focus:border-[#b88b1b] focus:ring-1 focus:ring-[#b88b1b] px-3 py-3 focus:ring-opacity-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-[#e8e8e8] border border-solid shadow-sm focus:border-[#b88b1b] focus:ring-1 focus:ring-[#b88b1b] px-3 py-3 focus:ring-opacity-50"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            {loading ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 bg-white shadow-md rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {[...Array(5)].map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : transactions.length > 0 ? (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 bg-white shadow-md rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map((transaction, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.transaction_date).toLocaleString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.batch_number}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.created_by_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={transaction.notes}>{transaction.notes}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.order_id || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 transition-all">
                                            <button onClick={() => handleViewMore(transaction)} className="text-[#b88b1b] hover:text-[#775a12]">
                                                <FontAwesomeIcon icon={faEye} className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center">
                            <span className="mr-2 text-sm text-gray-700">Items per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="rounded-md border-[#e8e8e8] border border-solid shadow-sm focus:border-[#b88b1b] focus:ring-1 focus:ring-[#b88b1b] p-2 focus:ring-opacity-50"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-gray-500 text-center py-8">No inventory transactions found.</p>
            )}
            {selectedDetails && (
                <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full overflow-y-auto max-h-[80vh]">
                        <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
                        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                            <h3 className="text-lg font-semibold mb-2">Transaction Information</h3>
                            {selectedDetails.transaction ? (
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                    <dt className="font-medium text-gray-700">Date:</dt>
                                    <dd className="text-gray-900">{new Date(selectedDetails.transaction.transaction_date).toLocaleString()}</dd>
                                    <dt className="font-medium text-gray-700">Type:</dt>
                                    <dd className="text-gray-900">{selectedDetails.transaction.type}</dd>
                                    <dt className="font-medium text-gray-700">Notes:</dt>
                                    <dd className="text-gray-900 break-words">{selectedDetails.transaction.notes}</dd>
                                    <dt className="font-medium text-gray-700">Order ID:</dt>
                                    <dd className="text-gray-900">{selectedDetails.transaction.order_id || 'N/A'}</dd>
                                </dl>
                            ) : (
                                <p>No transaction details available.</p>
                            )}
                        </div>
                        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                            <h3 className="text-lg font-semibold mb-2">Employee Information</h3>
                            {selectedDetails.employee ? (
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                    <dt className="font-medium text-gray-700">Name:</dt>
                                    <dd className="text-gray-900">{selectedDetails.employee.first_name} {selectedDetails.employee.last_name}</dd>
                                    <dt className="font-medium text-gray-700">Email:</dt>
                                    <dd className="text-gray-900">{selectedDetails.employee.email}</dd>
                                    <dt className="font-medium text-gray-700">Position:</dt>
                                    <dd className="text-gray-900">{selectedDetails.employee.position}</dd>
                                    <dt className="font-medium text-gray-700">Department:</dt>
                                    <dd className="text-gray-900">{selectedDetails.employee.departments?.name || 'N/A'}</dd>
                                    
                                    <dt className="font-medium text-gray-700">Role:</dt>
                                    <dd className="text-gray-900">{selectedDetails.employee.role}</dd>
                                    {selectedDetails.employee.phone_number && (
                                        <>
                                            <dt className="font-medium text-gray-700">Phone Number:</dt>
                                            <dd className="text-gray-900">{selectedDetails.employee.phone_number}</dd>
                                        </>
                                    )}
                                </dl>
                            ) : (
                                <p>No employee details available.</p>
                            )}
                        </div>
                        {selectedDetails.batch && (
                            <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                                <h3 className="text-lg font-semibold mb-2">Batch Information</h3>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                    <dt className="font-medium text-gray-700">Batch Number:</dt>
                                    <dd className="text-gray-900">{selectedDetails.batch.batch_number}</dd>
                                    <dt className="font-medium text-gray-700">Status:</dt>
                                    <dd className="text-gray-900">{selectedDetails.batch.status}</dd>
                                    <dt className="font-medium text-gray-700">Expected Date:</dt>
                                    <dd className="text-gray-900">{selectedDetails.batch.expected_date}</dd>
                                    <dt className="font-medium text-gray-700">Received Date:</dt>
                                    <dd className="text-gray-900">{selectedDetails.batch.received_date || 'N/A'}</dd>
                                    <dt className="font-medium text-gray-700">Notes:</dt>
                                    <dd className="text-gray-900">{selectedDetails.batch.notes || 'N/A'}</dd>
                                    <dt className="font-medium text-gray-700">Created At:</dt>
                                    <dd className="text-gray-900">{new Date(selectedDetails.batch.created_at).toLocaleString()}</dd>
                                    <dt className="font-medium text-gray-700">Updated At:</dt>
                                    <dd className="text-gray-900">{new Date(selectedDetails.batch.updated_at).toLocaleString()}</dd>
                                </dl>
                            </div>
                        )}
                        {selectedDetails.supplier && (
                            <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                                <h3 className="text-lg font-semibold mb-2">Supplier Information</h3>
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                                    <dt className="font-medium text-gray-700">Name:</dt>
                                    <dd className="text-gray-900">{selectedDetails.supplier.name}</dd>
                                    <dt className="font-medium text-gray-700">Address:</dt>
                                    <dd className="text-gray-900">{selectedDetails.supplier.address}</dd>
                                    <dt className="font-medium text-gray-700">Contact Email:</dt>
                                    <dd className="text-gray-900">{selectedDetails.supplier.contact_email}</dd>
                                    <dt className="font-medium text-gray-700">Contact Phone:</dt>
                                    <dd className="text-gray-900">{selectedDetails.supplier.contact_phone}</dd>
                                    {selectedDetails.supplier.website && (
                                        <>
                                            <dt className="font-medium text-gray-700">Website:</dt>
                                            <dd className="text-gray-900">{selectedDetails.supplier.website}</dd>
                                        </>
                                    )}
                                    {selectedDetails.supplier.notes && (
                                        <>
                                            <dt className="font-medium text-gray-700">Notes:</dt>
                                            <dd className="text-gray-900">{selectedDetails.supplier.notes}</dd>
                                        </>
                                    )}
                                    <dt className="font-medium text-gray-700">Created At:</dt>
                                    <dd className="text-gray-900">{new Date(selectedDetails.supplier.created_at).toLocaleString()}</dd>
                                </dl>
                            </div>
                        )}
                        <button
                            className="bg-[#b88b1b] transition-all float-right text-white px-4 py-2 rounded hover:bg-[#977215]"
                            onClick={() => setSelectedDetails(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportsPage;