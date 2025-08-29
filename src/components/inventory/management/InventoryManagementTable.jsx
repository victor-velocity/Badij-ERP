"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEye, faEdit, faTrash, faAngleLeft, faAngleRight } from '@fortawesome/free-solid-svg-icons';

const initialInventory = [
    { name: 'Modern wooden chair', id: 'CHR-102', warehouse: 'Fatomg', unitPrice: '₦100,000', stockQty: 100, totalValue: '₦2,000,000', status: 'In stock' },
    { name: '3-seater sofa', id: 'SFA-245', warehouse: 'Epe', unitPrice: '₦80,000', stockQty: 12, totalValue: '₦1,000,000', status: 'Low stock' },
    { name: 'Queen bed frame', id: 'BED-523', warehouse: 'Ajah', unitPrice: '₦200,000', stockQty: 0, totalValue: 'ND', status: 'Out of stock' },
    { name: 'Rounding dinning table', id: 'TBL-321', warehouse: 'Lekki', unitPrice: '₦100,000', stockQty: 200, totalValue: '₦3,000,000', status: 'In stock' },
    { name: 'Wooden chair', id: 'WC-235', warehouse: 'Fatomg', unitPrice: '₦50,000', stockQty: 15, totalValue: '₦800,000', status: 'Low stock' },
    { name: 'Wooden dinning table', id: 'TBL-349', warehouse: 'Epe', unitPrice: '₦100,000', stockQty: 0, totalValue: 'ND', status: 'Out of stock' },
    { name: 'Recliner chair', id: 'CHR-765', warehouse: 'Epe', unitPrice: '₦500,000', stockQty: 0, totalValue: 'ND', status: 'Out of stock' },
    { name: 'Ergonomic office chair', id: 'CHR-674', warehouse: 'Ajah', unitPrice: '₦200,000', stockQty: 200, totalValue: '₦5,000,000', status: 'In stock' },
    { name: 'King size bed frame', id: 'BED-241', warehouse: 'Fatomg', unitPrice: '₦1,500,000', stockQty: 500, totalValue: '₦100,000,000', status: 'In stock' },
];

const ITEMS_PER_PAGE = 8;
const goldColor = '#b88b1b';

export default function InventoryTable() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredInventory, setFilteredInventory] = useState(initialInventory);

    useEffect(() => {
        const results = initialInventory.filter(item =>
            Object.values(item).some(value =>
                value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredInventory(results);
        setCurrentPage(1);
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentInventory = filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const getStatusColor = (status) => {
        switch (status) {
            case 'In stock':
                return 'text-green-500';
            case 'Low stock':
                return 'text-yellow-500';
            case 'Out of stock':
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold flex-shrink-0">Inventory table</h2>
                <div className="flex w-full sm:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search inventory"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                        </div>
                    </div>
                    <button
                        className="px-4 py-2 rounded-md ml-3 text-white font-medium flex-shrink-0"
                        style={{ backgroundColor: goldColor }}
                        onClick={() => {}}
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit price</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Qty</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total value</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentInventory.map((item, index) => (
                            <tr key={index}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.warehouse}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.unitPrice}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.stockQty}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalValue}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                    <span className={getStatusColor(item.status)}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-4 text-gray-500">
                                        <button className="hover:text-gray-700 transition-colors duration-200" aria-label="View">
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button className="hover:text-gray-700 transition-colors duration-200" aria-label="Edit">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button className="hover:text-gray-700 transition-colors duration-200" aria-label="Delete">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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
