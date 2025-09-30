import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';

const DeleteStockModal = ({ stock, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [itemDetails, setItemDetails] = useState(null);
    const [batchDetails, setBatchDetails] = useState(null);

    // Load item and batch details when component mounts
    useEffect(() => {
        const loadDetails = async () => {
            try {
                // Load item details
                if (stock.contents_type === 'product') {
                    const productResponse = await apiService.getProductById(stock.contents_id);
                    if (productResponse.status === 'success' && productResponse.data) {
                        setItemDetails(productResponse.data[0] || productResponse.data);
                    }
                } else {
                    const componentResponse = await apiService.getComponentById(stock.contents_id);
                    if (componentResponse.status === 'success' && componentResponse.data) {
                        setItemDetails(componentResponse.data[0] || componentResponse.data);
                    }
                }

                // Load batch details
                if (stock.batch_id) {
                    const batchResponse = await apiService.getImportBatchById(stock.batch_id);
                    if (batchResponse.status === 'success' && batchResponse.data) {
                        setBatchDetails(batchResponse.data[0] || batchResponse.data);
                    }
                }
            } catch (error) {
                console.error('Error loading details:', error);
            }
        };

        loadDetails();
    }, [stock]);

    const handleDelete = async () => {
        setLoading(true);

        try {
            const response = await apiService.deleteStock(stock.box_id);
            if (response.status === 'success') {
                toast.success('Stock entry deleted successfully');
                onClose();
                onSuccess();
            } else {
                toast.error(response.message || 'Failed to delete stock entry');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete stock entry';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'in_stock': return 'bg-green-100 text-green-800';
            case 'sold': return 'bg-blue-100 text-blue-800';
            case 'damaged': return 'bg-red-100 text-red-800';
            case 'quarantined': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeColor = (type) => {
        return type === 'product' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="px-6 py-4 border-b border-red-200 bg-red-50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-red-800">Delete Stock Entry</h3>
                </div>
                
                <div className="p-6">
                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Warning: This action cannot be undone
                                </h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>
                                        This will permanently delete the stock entry and remove it from the inventory system.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Stock Entry Details</h4>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Barcode:</span>
                                <span className="font-mono text-gray-900">{stock.barcode}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Item:</span>
                                <span className="text-gray-900">
                                    {itemDetails ? itemDetails.name : 'Loading...'}
                                    {itemDetails?.sku && (
                                        <span className="text-gray-500 text-xs block">SKU: {itemDetails.sku}</span>
                                    )}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Type:</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(stock.contents_type)}`}>
                                    {stock.contents_type?.toUpperCase()}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Quantity:</span>
                                <span className="text-gray-900">{stock.quantity_in_box}</span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Batch:</span>
                                <span className="text-gray-900">
                                    {batchDetails ? batchDetails.batch_number : 'Loading...'}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(stock.status)}`}>
                                    {stock.status?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            
                            {stock.location_id && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Location:</span>
                                    <span className="text-gray-900">{stock.location_id}</span>
                                </div>
                            )}
                            
                            {stock.shelf_code && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shelf:</span>
                                    <span className="text-gray-900">{stock.shelf_code}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Created:</span>
                                <span className="text-gray-900">
                                    {stock.created_at ? new Date(stock.created_at).toLocaleDateString() : 'Unknown'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Impact Information */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">
                                    Important Note
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        Deleting this stock entry will also update the total stock count for the associated item.
                                        This action may affect inventory reporting and stock availability.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Stock Entry'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteStockModal;