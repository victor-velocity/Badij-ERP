import React from 'react';

const ViewBatchModal = ({ batch, supplierDetails, onClose }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString();
    };

    const formatStatus = (status) => {
        return status ? status.replace('_', ' ').toUpperCase() : 'Unknown';
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        in_transit: 'bg-purple-100 text-purple-800'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Batch Details</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                        <p className="mt-1 text-sm text-gray-900 font-medium">{batch.batch_number}</p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier Information</label>
                        <div className="mt-1 text-sm text-gray-900 space-y-1">
                            <p className="font-medium">{supplierDetails.name}</p>
                            <p className="text-gray-600">Phone: {supplierDetails.contact}</p>
                            <p className="text-gray-600">Email: {supplierDetails.email}</p>
                            <p className="text-gray-600">Address: {supplierDetails.address}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(batch.expected_date)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Received Date</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(batch.received_date)}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${statusColors[batch.status] || 'bg-gray-100 text-gray-800'}`}>
                            {formatStatus(batch.status)}
                        </span>
                    </div>
                    
                    {batch.notes && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">{batch.notes}</p>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewBatchModal;