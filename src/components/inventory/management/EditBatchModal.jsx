import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';

const EditBatchModal = ({ batch, onClose, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        supplier_id: '',
        batch_number: '',
        received_date: '',
        expected_date: '',
        status: 'pending',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (batch) {
            setFormData({
                supplier_id: batch.supplier_id || '',
                batch_number: batch.batch_number || '',
                received_date: batch.received_date || '',
                expected_date: batch.expected_date || '',
                status: batch.status || 'pending',
                notes: batch.notes || ''
            });
        }
    }, [batch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await apiService.updateImportBatch(batch.batch_id, formData);
            if (response.status === 'success') {
                onSuccess();
            } else {
                onError(response.message || 'Failed to update import batch');
            }
        } catch (error) {
            onError(error.message || 'Failed to update import batch');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Edit Import Batch</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="supplier_id" className="block text-sm font-medium text-gray-700">
                            Supplier ID
                        </label>
                        <input
                            type="text"
                            id="supplier_id"
                            name="supplier_id"
                            required
                            value={formData.supplier_id}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="batch_number" className="block text-sm font-medium text-gray-700">
                            Batch Number
                        </label>
                        <input
                            type="text"
                            id="batch_number"
                            name="batch_number"
                            required
                            value={formData.batch_number}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="received_date" className="block text-sm font-medium text-gray-700">
                            Received Date
                        </label>
                        <input
                            type="date"
                            id="received_date"
                            name="received_date"
                            value={formData.received_date}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="expected_date" className="block text-sm font-medium text-gray-700">
                            Expected Date
                        </label>
                        <input
                            type="date"
                            id="expected_date"
                            name="expected_date"
                            value={formData.expected_date}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="in_transit">In Transit</option>
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditBatchModal;