// components/inventory/management/ViewStockModal.jsx
import React from 'react';

const ViewStockModal = ({ stock, itemDetails, batchDetails, onClose }) => {
    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Stock Entry Details</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Barcode</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{stock.barcode}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <p className="mt-1 text-sm text-gray-900 capitalize">{stock.contents_type}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Item</label>
                        <p className="mt-1 text-sm text-gray-900">{itemDetails?.name || 'Loading...'}</p>
                        <p className="text-sm text-gray-500">SKU: {itemDetails?.sku || 'Loading...'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Quantity</label>
                            <p className="mt-1 text-sm text-gray-900">{stock.quantity_in_box}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                stock.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                                stock.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                                stock.status === 'damaged' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }`}>
                                {stock.status?.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Batch</label>
                        <p className="mt-1 text-sm text-gray-900">{batchDetails?.batch_number || 'Loading...'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <p className="mt-1 text-sm text-gray-900">{stock.location_id || 'Not assigned'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Shelf Code</label>
                            <p className="mt-1 text-sm text-gray-900">{stock.shelf_code || 'Not assigned'}</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewStockModal;