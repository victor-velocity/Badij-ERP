"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faAngleLeft, faAngleRight, faBox, faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';

const ITEMS_PER_PAGE = 8;
const goldColor = '#153087';

export const StockLocationTable = ({ products = [], components = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredData, setFilteredData] = useState([]);
    const [selectedType, setSelectedType] = useState('all');

    const formatTableData = () => {
        const productData = products.map(product => ({
            id: product.product_id,
            name: product.name,
            sku: product.sku,
            type: 'Product',
            stock_quantity: product.stock_quantity,
            category: 'Furniture',
            last_updated: new Date().toLocaleDateString(),
            status: product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'
        }));

        const componentData = components.map(component => ({
            id: component.component_id,
            name: component.name,
            sku: component.sku,
            type: 'Component',
            stock_quantity: component.stock_quantity,
            category: 'Raw Material',
            last_updated: new Date().toLocaleDateString(),
            status: component.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'
        }));

        return [...productData, ...componentData];
    };

    useEffect(() => {
        const allData = formatTableData();

        let filtered = allData.filter(item => {
            const matchesSearch = Object.values(item).some(value =>
                value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            );

            const matchesType = selectedType === 'all' ||
                (selectedType === 'products' && item.type === 'Product') ||
                (selectedType === 'components' && item.type === 'Component');

            return matchesSearch && matchesType;
        });

        setFilteredData(filtered);
        setCurrentPage(1);
    }, [searchTerm, selectedType, products, components]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleTypeFilter = (type) => {
        setSelectedType(type);
    };

    const getStatusColor = (status, quantity) => {
        if (status === 'Out of Stock') return 'text-red-600 bg-red-100';
        if (quantity < 10) return 'text-[#153087] bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    const getStatusText = (quantity) => {
        if (quantity === 0) return 'Out of Stock';
        if (quantity < 10) return 'Low Stock';
        return 'In Stock';
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
            pageNumbers.push(
                <span
                    key="1"
                    className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50"
                    onClick={() => setCurrentPage(1)}
                >
                    1
                </span>
            );
            if (startPage > 2) {
                pageNumbers.push(<span key="ellipsis-start" className="px-3 py-1">...</span>);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(
                <span
                    key={i}
                    className={`px-3 py-1 rounded-md border border-gray-300 cursor-pointer ${currentPage === i ? 'text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    style={currentPage === i ? { backgroundColor: goldColor } : {}}
                    onClick={() => setCurrentPage(i)}
                >
                    {i}
                </span>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pageNumbers.push(<span key="ellipsis-end" className="px-3 py-1">...</span>);
            }
            pageNumbers.push(
                <span
                    key={totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50"
                    onClick={() => setCurrentPage(totalPages)}
                >
                    {totalPages}
                </span>
            );
        }

        return pageNumbers;
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 justify-between">
                    {/* Type Filter Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedType === 'all'
                                    ? 'text-white'
                                    : 'text-gray-600 bg-white border border-gray-300'
                                }`}
                            style={selectedType === 'all' ? { backgroundColor: goldColor } : {}}
                            onClick={() => handleTypeFilter('all')}
                        >
                            All Items
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${selectedType === 'products'
                                    ? 'text-white'
                                    : 'text-gray-600 bg-white border border-gray-300'
                                }`}
                            style={selectedType === 'products' ? { backgroundColor: goldColor } : {}}
                            onClick={() => handleTypeFilter('products')}
                        >
                            <FontAwesomeIcon icon={faBox} />
                            Products ({products.length})
                        </button>
                        <button
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${selectedType === 'components'
                                    ? 'text-white'
                                    : 'text-gray-600 bg-white border border-gray-300'
                                }`}
                            style={selectedType === 'components' ? { backgroundColor: goldColor } : {}}
                            onClick={() => handleTypeFilter('components')}
                        >
                            <FontAwesomeIcon icon={faPuzzlePiece} />
                            Components ({components.length})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full sm:w-64 pl-4 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.length > 0 ? (
                            currentData.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.sku}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'Product'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-green-100 text-green-800'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.category}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.stock_quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getStatusText(item.stock_quantity), item.stock_quantity)}`}>
                                            {getStatusText(item.stock_quantity)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.last_updated}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <FontAwesomeIcon icon={faBox} className="text-4xl text-gray-300 mb-2" />
                                        <p className="text-lg">No items found</p>
                                        <p className="text-sm mt-1">
                                            {searchTerm ? 'Try adjusting your search terms' : 'No items available in this location'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
                <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} items
                    </div>
                    <div className="flex justify-center items-center gap-2">
                        <button
                            className="flex items-center justify-center p-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            style={{ backgroundColor: currentPage === 1 ? '#f3f4f6' : goldColor }}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                        >
                            <FontAwesomeIcon
                                icon={faAngleLeft}
                                className={currentPage === 1 ? 'text-gray-400' : 'text-white'}
                            />
                        </button>
                        <div className="flex gap-2 text-sm font-medium">
                            {renderPaginationNumbers()}
                        </div>
                        <button
                            className="flex items-center justify-center p-2 rounded-md border border-gray-300 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            style={{ backgroundColor: currentPage === totalPages ? '#f3f4f6' : goldColor }}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                        >
                            <FontAwesomeIcon
                                icon={faAngleRight}
                                className={currentPage === totalPages ? 'text-gray-400' : 'text-white'}
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockLocationTable;