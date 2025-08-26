"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEye, faEdit, faTrash, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';

const initialOrders = [
    { id: '#1234', customer: 'Abdulkauf Fuad', product: 'Chair A', price: '₦100,000', date: '12/08/2025', status: 'Completed' },
    { id: '#5467', customer: 'John Doe', product: 'Chair B', price: '₦200,000', date: '11/08/2025', status: 'Pending' },
    { id: '#6598', customer: 'Irene Victor', product: 'Chair C', price: '₦80,000', date: '11/08/2025', status: 'Cancelled' },
    { id: '#9465', customer: 'Tobi Victor', product: 'Chair D', price: '₦1,000,000', date: '09/08/2025', status: 'Completed' },
    { id: '#0475', customer: 'Michael Smith', product: 'Chair A', price: '₦500,000', date: '09/08/2025', status: 'Pending' },
    { id: '#9607', customer: 'Michael Oliver', product: 'Chair A', price: '₦400,000', date: '08/08/2025', status: 'Cancelled' },
    { id: '#0467', customer: 'Sunday Okafor', product: 'Chair B', price: '₦700,000', date: '07/08/2025', status: 'Cancelled' },
    { id: '#9800', customer: 'Bola Musa', product: 'Chair C', price: '₦100,000', date: '06/07/2025', status: 'Completed' },
    { id: '#8698', customer: 'Favor Evro', product: 'Chair D', price: '₦300,000', date: '05/07/2025', status: 'Completed' },
];

const ITEMS_PER_PAGE = 8;
const goldColor = '#b88b1b';

export default function OrderListTable() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredOrders, setFilteredOrders] = useState(initialOrders);

    useEffect(() => {
        const results = initialOrders.filter(order =>
            Object.values(order).some(value =>
                value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredOrders(results);
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'text-green-500';
            case 'Pending':
                return 'text-yellow-500';
            case 'Cancelled':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const renderPaginationNumbers = () => {
        const pageNumbers = [];
        const maxPagesToShow = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            pageNumbers.push(<span key="1" className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer" onClick={() => setCurrentPage(1)}>1</span>);
            if (startPage > 2) {
                pageNumbers.push(<span key="ellipsis-start" className="px-3 py-1 rounded-md border border-gray-300">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <span
                    key={i}
                    className={`px-3 py-1 rounded-md border border-gray-300 cursor-pointer ${currentPage === i ? 'text-white font-medium' : 'text-gray-600'}`}
                    style={currentPage === i ? { backgroundColor: goldColor } : {}}
                    onClick={() => setCurrentPage(i)}
                >
                    {i}
                </span>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push(<span key="ellipsis-end" className="px-3 py-1 rounded-md border border-gray-300">...</span>);
            }
            pageNumbers.push(<span key={totalPages} className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer" onClick={() => setCurrentPage(totalPages)}>{totalPages}</span>);
        }

        return pageNumbers;
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold flex-shrink-0">Order list</h2>
                <div className="flex w-full sm:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search orders"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                        </div>
                    </div>
                    <button
                        className="px-6 py-2 rounded-md ml-3 text-white font-medium flex-shrink-0"
                        style={{ backgroundColor: goldColor }}
                        onClick={() => {}}
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentOrders.map((order, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.product}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.price}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={getStatusColor(order.status)}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-4 text-gray-500">
                                        <button className="hover:text-gray-700 transition-colors duration-200" aria-label="View">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button className="hover:text-green-700 transition-colors duration-200" aria-label="Edit">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button className="hover:text-red-700 transition-colors duration-200" aria-label="Delete">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center items-center gap-2">
                <button
                    className="flex items-center justify-center p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    style={{ backgroundColor: goldColor }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <FontAwesomeIcon icon={faAngleLeft} className="text-white" />
                </button>
                <div className="flex gap-2 text-sm font-medium">
                    {renderPaginationNumbers()}
                </div>
                <button
                    className="flex items-center justify-center p-2 rounded-md border border-gray-300 disabled:opacity-50"
                    style={{ backgroundColor: goldColor }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                >
                    <FontAwesomeIcon icon={faAngleRight} className="text-white" />
                </button>
            </div>
        </div>
    );
}
