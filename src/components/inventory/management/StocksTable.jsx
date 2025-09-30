"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash, faPlus } from "@fortawesome/free-solid-svg-icons";
import apiService from "@/app/lib/apiService";
import StockEntryModal from "./StockEntryModal";
import ViewStockModal from "./ViewStockModal";
import EditStockModal from "./EditStockModal";
import DeleteStockModal from "./DeleteStockModal";
import toast from 'react-hot-toast';

export default function StocksTable({ onDataChange }) {
    const [stocks, setStocks] = useState([]);
    const [products, setProducts] = useState({});
    const [components, setComponents] = useState({});
    const [batches, setBatches] = useState({});
    const [locations, setLocations] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [importBatches, setImportBatches] = useState([]);

    useEffect(() => {
        loadStocks();
        loadImportBatches();
    }, []);

    const loadImportBatches = async () => {
        try {
            const response = await apiService.getImportBatches();
            if (response.status === 'success') {
                setImportBatches(response.data || []);
            }
        } catch (error) {
            console.error('Error loading import batches:', error);
        }
    };

    const fetchItemDetails = async (stock) => {
        try {
            if (stock.contents_type === 'product') {
                if (!products[stock.contents_id]) {
                    const response = await apiService.getProductById(stock.contents_id);
                    if (response.status === 'success' && response.data) {
                        const productData = response.data[0] || response.data;
                        setProducts(prev => ({
                            ...prev,
                            [stock.contents_id]: productData
                        }));
                    }
                }
            } else {
                if (!components[stock.contents_id]) {
                    const response = await apiService.getComponentById(stock.contents_id);
                    if (response.status === 'success' && response.data) {
                        const componentData = response.data[0] || response.data;
                        setComponents(prev => ({
                            ...prev,
                            [stock.contents_id]: componentData
                        }));
                    }
                }
            }

            // Fetch batch details
            if (stock.batch_id && !batches[stock.batch_id]) {
                const batchResponse = await apiService.getImportBatchById(stock.batch_id);
                if (batchResponse.status === 'success' && batchResponse.data) {
                    const batchData = batchResponse.data[0] || batchResponse.data;
                    setBatches(prev => ({
                        ...prev,
                        [stock.batch_id]: batchData
                    }));
                }
            }

        } catch (error) {
            console.error(`Error fetching details for stock ${stock.box_id}:`, error);
        }
    };

    const loadStocks = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiService.getStocks();

            if (response.status === 'success') {
                const stocksData = response.data || [];
                setStocks(stocksData);

                // Fetch details for all stocks
                const detailPromises = stocksData.map(stock => fetchItemDetails(stock));
                await Promise.all(detailPromises);
            } else {
                setError('Failed to load stock entries');
                toast.error('Failed to load stock entries');
            }
        } catch (error) {
            console.error('Error loading stocks:', error);
            setError('Failed to load stock entries');
            toast.error('Failed to load stock entries');
        } finally {
            setLoading(false);
        }
    };

    const getItemDisplayName = (stock) => {
        if (stock.contents_type === 'product') {
            const product = products[stock.contents_id];
            return product ? product.name : "Loading...";
        } else {
            const component = components[stock.contents_id];
            return component ? component.name : "Loading...";
        }
    };

    const getItemSKU = (stock) => {
        if (stock.contents_type === 'product') {
            const product = products[stock.contents_id];
            return product ? product.sku : "Loading...";
        } else {
            const component = components[stock.contents_id];
            return component ? component.sku : "Loading...";
        }
    };

    const getBatchDisplay = (batchId) => {
        const batch = batches[batchId];
        return batch ? batch.batch_number : "Loading...";
    };

    const getLocationDisplay = (locationId) => {
        // You might want to fetch locations from your API
        // For now, returning the ID or a placeholder
        return locationId || "Not assigned";
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        loadStocks();
        onDataChange();
    };

    const handleUpdateSuccess = () => {
        setShowEditModal(false);
        setSelectedStock(null);
        loadStocks();
        onDataChange();
    };

    const handleDeleteSuccess = () => {
        setShowDeleteModal(false);
        setSelectedStock(null);
        loadStocks();
        onDataChange();
    };

    const openViewModal = async (stock) => {
        setSelectedStock(stock);
        await fetchItemDetails(stock);
        setShowViewModal(true);
    };

    const openEditModal = async (stock) => {
        setSelectedStock(stock);
        await fetchItemDetails(stock);
        setShowEditModal(true);
    };

    const openDeleteModal = (stock) => {
        setSelectedStock(stock);
        setShowDeleteModal(true);
    };

    const statusColors = {
        in_stock: 'bg-green-100 text-green-800',
        sold: 'bg-blue-100 text-blue-800',
        damaged: 'bg-red-100 text-red-800',
        quarantined: 'bg-yellow-100 text-yellow-800'
    };

    const typeColors = {
        product: 'bg-purple-100 text-purple-800',
        component: 'bg-orange-100 text-orange-800'
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b88b1b]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Stock Entries</h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#b88b1b] text-white px-4 py-2 rounded-lg transition-all hover:bg-[#856515] flex items-center"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Add Stock
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Barcode
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Batch
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stocks.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                    No stock entries found
                                </td>
                            </tr>
                        ) : (
                            stocks.map((stock) => (
                                <tr key={stock.box_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                        {stock.barcode || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {getItemDisplayName(stock)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                SKU: {getItemSKU(stock)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeColors[stock.contents_type] || 'bg-gray-100 text-gray-800'}`}>
                                            {stock.contents_type?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {stock.quantity_in_box}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {getBatchDisplay(stock.batch_id)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {getLocationDisplay(stock.location_id)}
                                        {stock.shelf_code && (
                                            <div className="text-xs text-gray-400">
                                                Shelf: {stock.shelf_code}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[stock.status] || 'bg-gray-100 text-gray-800'}`}>
                                            {stock.status?.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => openViewModal(stock)}
                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                            title="View Details"
                                        >
                                            <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(stock)}
                                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                            title="Edit Stock"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(stock)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                                            title="Delete Stock"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showCreateModal && (
                <StockEntryModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                    importBatches={importBatches}
                />
            )}

            {showViewModal && selectedStock && (
                <ViewStockModal
                    stock={selectedStock}
                    itemDetails={
                        selectedStock.contents_type === 'product' 
                            ? products[selectedStock.contents_id]
                            : components[selectedStock.contents_id]
                    }
                    batchDetails={batches[selectedStock.batch_id]}
                    onClose={() => setShowViewModal(false)}
                />
            )}

            {showEditModal && selectedStock && (
                <EditStockModal
                    stock={selectedStock}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={handleUpdateSuccess}
                    importBatches={importBatches}
                />
            )}

            {showDeleteModal && selectedStock && (
                <DeleteStockModal
                    stock={selectedStock}
                    onClose={() => setShowDeleteModal(false)}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </div>
    );
}