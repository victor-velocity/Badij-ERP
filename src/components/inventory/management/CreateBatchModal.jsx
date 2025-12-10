import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';

const CreateBatchModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        supplier_id: '',
        batch_number: '',
        received_date: '',
        expected_date: '',
        status: 'in_transit',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [suppliersLoading, setSuppliersLoading] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredSuppliers(suppliers);
        } else {
            const filtered = suppliers.filter(supplier =>
                supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.contact_phone?.includes(searchTerm)
            );
            setFilteredSuppliers(filtered);
        }
    }, [searchTerm, suppliers]);

    const loadSuppliers = async () => {
        setSuppliersLoading(true);
        try {
            const response = await apiService.getSuppliers();
            if (response.status === 'success') {
                setSuppliers(response.data || []);
                setFilteredSuppliers(response.data || []);
            } else {
                toast.error('Failed to load suppliers');
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
            toast.error('Failed to load suppliers');
        } finally {
            setSuppliersLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.supplier_id || !formData.batch_number) {
            toast.error('Supplier and batch number are required');
            return;
        }

        // Validate received_date based on status
        if (formData.status === 'processing' && !formData.received_date) {
            toast.error('Received date is required when status is "Processing"');
            return;
        }

        // Prepare data for submission, excluding empty or irrelevant fields
        const submitData = {
            supplier_id: formData.supplier_id,
            batch_number: formData.batch_number,
            status: formData.status,
        };

        // Only include expected_date if provided and not empty
        if (formData.expected_date) {
            submitData.expected_date = formData.expected_date;
        }

        // Only include received_date if status is processing and provided
        if (formData.status === 'processing' && formData.received_date) {
            submitData.received_date = formData.received_date;
        }

        // Only include notes if provided and not empty or invalid (e.g., '---')
        if (formData.notes && formData.notes.trim() !== '' && formData.notes !== '---') {
            submitData.notes = formData.notes.trim();
        }

        setLoading(true);

        try {
            const response = await apiService.createImportBatch(submitData);
            if (response.status === 'success') {
                toast.success('Import batch created successfully');
                onClose();
                onSuccess();
            } else {
                toast.error(response.message || 'Failed to create import batch');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create import batch';
            toast.error(errorMessage);
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

        // Reset received_date when status changes from processing
        if (name === 'status' && value !== 'processing') {
            setFormData(prev => ({
                ...prev,
                received_date: ''
            }));
        }
    };

    const handleSupplierSelect = (supplier) => {
        setFormData(prev => ({
            ...prev,
            supplier_id: supplier.supplier_id
        }));
        setSearchTerm(supplier.name);
        setShowDropdown(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);

        // Clear supplier_id if search term is empty or doesn't match selected supplier
        if (e.target.value.trim() === '' ||
            (formData.supplier_id && !suppliers.find(s => s.supplier_id === formData.supplier_id && s.name.includes(e.target.value)))) {
            setFormData(prev => ({
                ...prev,
                supplier_id: ''
            }));
        }
    };

    const handleDropdownBlur = (e) => {
        setTimeout(() => {
            setShowDropdown(false);
        }, 200);
    };

    const getSelectedSupplierName = () => {
        if (!formData.supplier_id) return searchTerm;
        const selectedSupplier = suppliers.find(s => s.supplier_id === formData.supplier_id);
        return selectedSupplier ? selectedSupplier.name : searchTerm;
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Import New Batch</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Supplier Search Dropdown */}
                    <div className="relative">
                        <label htmlFor="supplier_search" className="block text-sm font-medium text-gray-700">
                            Supplier
                        </label>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                id="supplier_search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={handleDropdownBlur}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153087]"
                                placeholder="Search suppliers by name, email, or phone..."
                                required
                            />
                        </div>

                        {/* Dropdown List */}
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {suppliersLoading ? (
                                    <div className="px-4 py-2 text-sm text-gray-500">Loading suppliers...</div>
                                ) : filteredSuppliers.length === 0 ? (
                                    <div className="px-4 py-2 text-sm text-gray-500">No suppliers found</div>
                                ) : (
                                    filteredSuppliers.map((supplier) => (
                                        <div
                                            key={supplier.supplier_id}
                                            onClick={() => handleSupplierSelect(supplier)}
                                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${formData.supplier_id === supplier.supplier_id ? 'bg-blue-100' : ''
                                                }`}
                                        >
                                            <div className="font-medium text-gray-900">{supplier.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {supplier.contact_email} • {supplier.contact_phone}
                                            </div>
                                            {supplier.address && (
                                                <div className="text-xs text-gray-500 truncate">{supplier.address}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Hidden input for form submission */}
                        <input
                            type="hidden"
                            name="supplier_id"
                            value={formData.supplier_id}
                            required
                        />
                    </div>

                    {/* Selected Supplier Info */}
                    {formData.supplier_id && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="text-sm text-green-800">
                                <strong>Selected:</strong> {getSelectedSupplierName()}
                            </div>
                        </div>
                    )}

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
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#153087]"
                            placeholder="Enter batch number"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#153087]"
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
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#153087]"
                        >
                            <option value="in_transit">In Transit</option>
                            <option value="processing">Processing</option>
                        </select>
                    </div>

                    {/* Received Date - Only show when status is processing */}
                    {formData.status === 'processing' && (
                        <div>
                            <label htmlFor="received_date" className="block text-sm font-medium text-gray-700">
                                Received Date *
                            </label>
                            <input
                                type="date"
                                id="received_date"
                                name="received_date"
                                required
                                value={formData.received_date}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#153087]"
                            />
                            <p className="text-xs text-gray-500 mt-1">Required when status is "Processing"</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#153087]"
                            rows="3"
                            placeholder="Additional notes..."
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
                            disabled={loading || !formData.supplier_id || !formData.batch_number}
                            className="px-4 py-2 bg-[#153087] text-white rounded-md transition-all hover:bg-[#faf714] hover:text-[black] disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBatchModal;