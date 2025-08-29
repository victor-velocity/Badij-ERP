"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrash, faAngleLeft, faAngleRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { StockMovementModal } from './StockMovementModal';

const ITEMS_PER_PAGE = 8;
const goldColor = '#b88b1b';

export const StockMovementTable = () => {
    const initialMovementData = [
        { name: 'Modern wooden chair', id: 'CHR-102', dateTime: '07/08/2025 10:00 AM', movementType: 'Stock In', quantity: '+10', from: 'Supplier', to: 'Fatomg Store', performer: 'Admin', reason: 'New purchase' },
        { name: '3-seater sofa', id: 'SFA-245', dateTime: '11/08/2025 12:30 AM', movementType: 'Stock Out', quantity: '-2', from: 'Lekki Store', to: 'Customer', performer: 'Sales rep', reason: 'Customer order' },
        { name: 'Queen bed frame', id: 'BED-523', dateTime: '15/08/2025 10:00 AM', movementType: 'Transfer', quantity: '-4', from: 'Epe Store', to: 'Ajah Store', performer: 'Store manager', reason: 'Branch stock transfer' },
        { name: 'Rounding dinning table', id: 'TBL-321', dateTime: '20/08/2025 9:00 AM', movementType: 'Adjustment', quantity: '+1', from: 'Fatomg Store', to: 'Fatomg Store', performer: 'Admin', reason: 'Inventory count correction' },
        { name: 'Wooden chair', id: 'WC-235', dateTime: '25/08/2025 10:00 AM', movementType: 'Stock In', quantity: '+15', from: 'Supplier', to: 'Lekki Store', performer: 'Admin', reason: 'New purchase' },
        { name: 'Wooden dinning table', id: 'TBL-349', dateTime: '11/08/2025 12:30 AM', movementType: 'Stock Out', quantity: '-2', from: 'Lekki Store', to: 'Customer', performer: 'Sales rep', reason: 'Customer order' },
        { name: 'Recliner chair', id: 'CHR-765', dateTime: '15/08/2025 10:00 AM', movementType: 'Transfer', quantity: '-2', from: 'Epe Store', to: 'Ajah Store', performer: 'Store manager', reason: 'Branch stock transfer' },
        { name: 'Ergonomic office chair', id: 'CHR-674', dateTime: '20/08/2025 9:00 AM', movementType: 'Adjustment', quantity: '+1', from: 'Fatomg Store', to: 'Fatomg Store', performer: 'Admin', reason: 'Inventory count correction' },
        { name: 'King size bed frame', id: 'BED-241', dateTime: '11/08/2025 12:30 AM', movementType: 'Stock Out', quantity: '-2', from: 'Fatomg Store', to: 'Customer', performer: 'Sales rep', reason: 'Customer order' },
    ];
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredData, setFilteredData] = useState(initialMovementData);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const results = initialMovementData.filter(item => 
            Object.values(item).some(value => 
                value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredData(results);
        setCurrentPage(1);
    }, [searchTerm]);

    const handleOpenModal = (item = null) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
                <h2 className="text-xl font-bold flex-shrink-0">Stock movement table</h2>
                <div className="flex w-full sm:w-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search stock movement"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                        </div>
                    </div>
                    <button
                        className="px-6 py-2 rounded-md text-white font-medium flex-shrink-0 ml-4 flex items-center justify-center gap-2"
                        style={{ backgroundColor: goldColor }}
                        onClick={() => handleOpenModal()}
                    >
                        Add new movement
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & time</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Movement type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From location</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To location</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed by</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.dateTime}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.movementType}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.from}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.to}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.performer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-4 text-gray-500">
                                        <button 
                                            className="text-blue-500 hover:text-blue-700 transition-colors duration-200" 
                                            aria-label="Edit"
                                            onClick={() => handleOpenModal(item)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button className="text-red-500 hover:text-red-700 transition-colors duration-200" aria-label="Delete">
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

            <StockMovementModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                initialData={selectedItem} 
            />
        </div>
    );
};

export default StockMovementTable;
