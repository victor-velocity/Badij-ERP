"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import apiService from "@/app/lib/apiService";
import toast from 'react-hot-toast';

const SkeletonRow = () => (
    <tr>
        <td className="px-6 py-4">
            <div className="h-5 bg-gray-200 rounded-full w-20 animate-pulse"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
        </td>
    </tr>
);

export default function StocksTable({ 
    filter = 'all', 
    searchTerm = '', 
    currentPage = 1, 
    setCurrentPage, 
    itemsPerPage = 10 
}) {
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        loadStockSummary();
    }, []);

    const loadStockSummary = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiService.getStocks();

            if (response.status === 'success') {
                const productItems = (response.data.products || []).map(p => ({
                    ...p,
                    type: 'product',
                    id: p.product_id,
                    components_needed: p.components_needed || []
                }));
                const componentItems = (response.data.components || []).map(c => ({
                    ...c,
                    type: 'component',
                    id: c.component_id,
                    components_needed: []
                }));
                setAllItems([...productItems, ...componentItems]);
            } else {
                setError('Failed to load stock summary');
                toast.error('Failed to load stock summary');
                setAllItems([]);
            }
        } catch (error) {
            console.error('Error loading stock summary:', error);
            setError('Failed to load stock summary');
            toast.error('Failed to load stock summary');
            setAllItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter items
    const filteredItems = allItems.filter(item => {
        const matchesFilter = filter === 'all' || item.type === filter;
        const matchesSearch = searchTerm === '' || 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const toggleExpanded = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const typeColors = {
        product: 'bg-purple-100 text-purple-800',
        component: 'bg-orange-100 text-orange-800'
    };

    return (
        <div>
            {/* Error Message */}
            {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 rounded p-3">
                    {error}
                </div>
            )}

            {/* Summary */}
            <div className="mb-4 text-sm text-gray-600">
                Showing {filteredItems.length} of {allItems.length} items
                {filter !== 'all' && ` (${filter})`}
                {searchTerm && ` matching "${searchTerm}"`}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SKU
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            Array.from({ length: Math.min(5, itemsPerPage) }).map((_, index) => <SkeletonRow key={index} />)
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    {searchTerm || filter !== 'all' 
                                        ? 'No items match your search/filter' 
                                        : 'No stock entries found'
                                    }
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((item) => (
                                <React.Fragment key={item.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColors[item.type] || 'bg-gray-100 text-gray-800'}`}>
                                                {item.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.sku}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {item.stock_quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {item.type === 'product' && item.components_needed.length > 0 && (
                                                <button
                                                    onClick={() => toggleExpanded(item.id)}
                                                    className="text-[#b88b1b] hover:text-[#69500f] p-1 rounded hover:bg-amber-100"
                                                    title={expanded[item.id] ? "Hide Components" : "Show Components"}
                                                >
                                                    <FontAwesomeIcon icon={expanded[item.id] ? faChevronUp : faChevronDown} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {item.type === 'product' && expanded[item.id] && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-4 bg-gray-50">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Components Needed</h4>
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {item.components_needed.map((comp) => (
                                                            <tr key={comp.component_id}>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{comp.name}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{comp.sku}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{comp.required_quantity}</td>
                                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{comp.available_quantity}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} items
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 border rounded-md text-sm ${
                                    currentPage === page
                                        ? 'bg-[#b88b1b] text-white border-[#b88b1b]'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}