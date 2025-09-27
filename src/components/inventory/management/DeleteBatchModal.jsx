import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons";
import toast from 'react-hot-toast';

const DeleteBatchModal = ({ batch, onClose, onSuccess, onError }) => {
    const [loading, setLoading] = useState(false);
    const [supplierName, setSupplierName] = useState('Loading...');
    const [supplierLoading, setSupplierLoading] = useState(true);

    useEffect(() => {
        const fetchSupplierName = async () => {
            setSupplierLoading(true);
            try {
                const response = await apiService.getSuppliers();
                if (response.status === 'success' && response.data) {
                    const supplier = response.data.find(s => s.supplier_id === batch.supplier_id);
                    setSupplierName(supplier ? supplier.name : 'Unknown Supplier');
                } else {
                    setSupplierName('Failed to load supplier');
                    toast.error('Failed to load supplier information');
                }
            } catch (error) {
                console.error('Error fetching suppliers:', error);
                setSupplierName('Failed to load supplier');
                toast.error('Failed to load supplier information');
            } finally {
                setSupplierLoading(false);
            }
        };

        if (batch.supplier_id) {
            fetchSupplierName();
        } else {
            setSupplierName('No Supplier');
            setSupplierLoading(false);
        }
    }, [batch.supplier_id]);

    const handleDelete = async () => {
        setLoading(true);

        try {
            const response = await apiService.deleteImportBatch(batch.batch_id);
            if (response.status === 'success') {
                toast.success('Import batch deleted successfully');
                onSuccess();
            } else {
                const errorMessage = response.message || 'Failed to delete import batch';
                toast.error(errorMessage);
                onError(errorMessage);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to delete import batch';
            toast.error(errorMessage);
            onError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="px-6 py-4 border-b border-red-200 bg-red-50 rounded-t-lg">
                    <div className="flex items-center">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-3" />
                        <h3 className="text-lg font-semibold text-red-800">Confirm Deletion</h3>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-gray-700 mb-2">
                            Are you sure you want to delete the following import batch?
                        </p>
                        <div className="bg-gray-50 p-3 rounded-md">
                            <p className="font-medium text-gray-900">BATCH ID: {batch.batch_number}</p>
                            {batch.supplier_id && (
                                <p className="text-sm text-gray-600">
                                    Supplier: {supplierLoading ? 'Loading...' : supplierName}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Warning:</strong> This action cannot be undone. All data associated with this import batch will be permanently deleted.
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faTimes} className="mr-2" />
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={loading || supplierLoading}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            <FontAwesomeIcon icon={faTrash} className="mr-2" />
                            {loading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteBatchModal;