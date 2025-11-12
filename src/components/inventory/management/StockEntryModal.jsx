"use client";

import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import BarcodeSuccessModal from './BarCodeSuccessModal';
import toast from 'react-hot-toast';

const StockEntryModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        contents_type: 'product',
        contents_id: '',
        quantity_in_box: 1,
        status: 'in_stock',
        location_id: '',
        shelf_code: '',
        batch_id: '',
        boxes_count: 1
    });

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [components, setComponents] = useState([]);
    const [locations, setLocations] = useState([]);
    const [suppliers, setSuppliers] = useState({});
    const [batches, setBatches] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [locationsLoading, setLocationsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);


    useEffect(() => {
        loadProducts();
        loadComponents();
        loadLocationsFromSupabase();
        loadSuppliers();
        loadProcessingBatches();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredItems(getCurrentItems());
        } else {
            const filtered = getCurrentItems().filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    }, [searchTerm, formData.contents_type, products, components]);

    const getCurrentItems = () => {
        return formData.contents_type === 'product' ? products : components;
    };

    const loadProducts = async () => {
        try {
            setItemsLoading(true);
            const response = await apiService.getProducts();
            if (response.status === 'success') {
                setProducts(response.data || []);
            } else {
                toast.error('Failed to load products');
            }
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setItemsLoading(false);
        }
    };

    const loadComponents = async () => {
        try {
            setItemsLoading(true);
            const response = await apiService.getComponents();
            if (response.status === 'success') {
                setComponents(response.data || []);
            } else {
                toast.error('Failed to load components');
            }
        } catch (error) {
            toast.error('Failed to load components');
        } finally {
            setItemsLoading(false);
        }
    };

    // Load locations directly from Supabase
    const loadLocationsFromSupabase = async () => {
        try {
            setLocationsLoading(true);
            const response = await apiService.getLocationsFromSupabase();
            if (response.status === 'success') {
                setLocations(response.data || []);
            } else {
                toast.error('Failed to load locations');
            }
        } catch (error) {
            toast.error('Failed to load locations from Supabase');
        } finally {
            setLocationsLoading(false);
        }
    };

    const loadSuppliers = async () => {
        try {
            const response = await apiService.getSuppliers();
            if (response.status === 'success') {
                const supMap = (response.data || []).reduce((acc, sup) => {
                    acc[sup.supplier_id] = sup.name; // Use supplier_id
                    return acc;
                }, {});
                setSuppliers(supMap);
            }
        } catch (error) {
            toast.error('Failed to load suppliers');
        }
    };

    const loadProcessingBatches = async () => {
        try {
            setBatchesLoading(true);
            const response = await apiService.getImportBatches();
            if (response.status === 'success') {
                const processing = (response.data || []).filter(b => b.status === 'processing');
                setBatches(processing);
            } else {
                toast.error('Failed to load batches');
            }
        } catch (error) {
            toast.error('Failed to load batches');
        } finally {
            setBatchesLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.contents_id || !formData.batch_id || !formData.boxes_count) {
            toast.error('Item, batch, and boxes count are required');
            return;
        }

        if (formData.quantity_in_box < 1 || formData.boxes_count < 1) {
            toast.error('Quantity and boxes must be at least 1');
            return;
        }

        setLoading(true);

        try {
            const response = await apiService.createStockEntry(formData);

            if (response.status === 'success') {
                // FIX: Define firstBox from response.data[0]
                const firstBox = response.data?.[0] ?? {};

                setSuccessData({
                    barcodes: response.barcodes,
                    pdf: response.pdf,
                    itemName: firstBox.name ?? 'Unknown Item',
                    batchId: formData.batch_id,
                    boxesCount: formData.boxes_count,
                    quantityInBox: firstBox.quantity_in_box ?? formData.quantity_in_box, // fallback
                });

                setShowSuccessModal(true);
                toast.success('Stock entry created successfully');
            } else {
                toast.error(response.message || 'Failed to create stock entry');
            }
        } catch (error) {
            console.error('Stock entry error:', error); // Debug
            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Failed to create stock entry'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));

        if (name === 'contents_type') {
            setFormData(prev => ({
                ...prev,
                contents_id: ''
            }));
            setSearchTerm('');
        }
    };

    const handleItemSelect = (item) => {
        const contentIdField = formData.contents_type === 'product' ? 'product_id' : 'component_id';
        setFormData(prev => ({
            ...prev,
            contents_id: item[contentIdField]
        }));
        setSearchTerm(item.name);
        setShowDropdown(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
    };

    const handleDropdownBlur = () => {
        setTimeout(() => setShowDropdown(false), 200);
    };

    const getSelectedItemName = () => {
        if (!formData.contents_id) return searchTerm;
        const selectedItem = getCurrentItems().find(item => {
            const idField = formData.contents_type === 'product' ? 'product_id' : 'component_id';
            return item[idField] === formData.contents_id;
        });
        return selectedItem ? selectedItem.name : searchTerm;
    };

    const getItemDisplay = (item) => {
        return (
            <div>
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">
                    SKU: {item.sku} • Stock: {item.stock_quantity || 0}
                </div>
            </div>
        );
    };

    // Helper to get supplier name with fallback loading
    const getSupplierName = async (supplierId) => {
        if (suppliers[supplierId]) return suppliers[supplierId];
        try {
            const sup = await apiService.getSupplierById(supplierId);
            if (sup) {
                setSuppliers(prev => ({ ...prev, [supplierId]: sup.name }));
                return sup.name;
            }
        } catch (err) {
            console.warn('Failed to fetch supplier:', err);
        }
        return 'Unknown';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Add Stock Entry</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Content Type</label>
                        <select
                            name="contents_type"
                            value={formData.contents_type}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                        >
                            <option value="product">Product</option>
                            <option value="component">Component</option>
                        </select>
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {formData.contents_type === 'product' ? 'Product' : 'Component'}
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={handleDropdownBlur}
                            placeholder={`Search ${formData.contents_type}s...`}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                        />
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
                                {itemsLoading ? (
                                    <div className="p-4 text-center text-gray-500">Loading...</div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">No items found</div>
                                ) : (
                                    filteredItems.map((item) => (
                                        <div
                                            key={formData.contents_type === 'product' ? item.product_id : item.component_id}
                                            onMouseDown={() => handleItemSelect(item)}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                        >
                                            {getItemDisplay(item)}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        <input type="hidden" name="contents_id" value={formData.contents_id} required />
                    </div>

                    {formData.contents_id && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                            <p className="text-sm font-medium text-blue-800">
                                Selected: <span className="font-bold">{getSelectedItemName()}</span>
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Import Batch {batchesLoading && '(Loading...)'}
                        </label>
                        <select
                            name="batch_id"
                            value={formData.batch_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                            disabled={batchesLoading}
                        >
                            <option value="">
                                {batchesLoading ? 'Loading batches...' : 'Select batch (processing only)'}
                            </option>
                            {batches.length === 0 && !batchesLoading ? (
                                <option disabled>No processing batches</option>
                            ) : (
                                batches.map((batch) => {
                                    const supplierName = suppliers[batch.supplier_id] || 'Loading...';
                                    // Fire-and-forget to fill missing supplier
                                    if (!suppliers[batch.supplier_id]) {
                                        getSupplierName(batch.supplier_id);
                                    }
                                    return (
                                        <option key={batch.batch_id} value={batch.batch_id}>
                                            {batch.batch_number} - {supplierName}
                                        </option>
                                    );
                                })
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Qty per Box</label>
                            <input
                                type="number"
                                name="quantity_in_box"
                                min="1"
                                value={formData.quantity_in_box}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Boxes</label>
                            <input
                                type="number"
                                name="boxes_count"
                                min="1"
                                value={formData.boxes_count}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                        >
                            <option value="in_stock">In Stock</option>
                            <option value="sold">Sold</option>
                            <option value="damaged">Damaged</option>
                            <option value="quarantined">Quarantined</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Location {locationsLoading && '(Loading...)'}
                            </label>
                            <select
                                name="location_id"
                                value={formData.location_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                disabled={locationsLoading}
                            >
                                <option value="">
                                    {locationsLoading ? 'Loading...' : 'Select location'}
                                </option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Shelf Code</label>
                            <input
                                type="text"
                                name="shelf_code"
                                value={formData.shelf_code}
                                onChange={handleChange}
                                placeholder="e.g., A1-02"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            />
                        </div>
                    </div>

                    {formData.boxes_count > 0 && formData.quantity_in_box > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm font-bold text-blue-800">
                                Total Items: <span className="text-2xl">{formData.boxes_count * formData.quantity_in_box}</span>
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.contents_id || !formData.batch_id || locationsLoading}
                            className="px-6 py-2.5 bg-[#b88b1b] text-white rounded-xl font-medium hover:bg-[#9a7516] disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                        >
                            {loading ? 'Creating...' : 'Add Stock'}
                        </button>
                    </div>
                </form>
            </div>
            {showSuccessModal && (
                <BarcodeSuccessModal
                    isOpen={showSuccessModal}
                    onClose={() => {
                        setShowSuccessModal(false);
                        onSuccess();
                        onClose();
                    }}
                    barcodes={successData.barcodes}
                    pdfData={successData.pdf}
                    itemName={successData.itemName}
                    batchId={successData.batchId}
                    boxesCount={successData.boxesCount}
                    quantityInBox={successData.quantityInBox} // PASS IT
                />
            )}
        </div>
    );
};

export default StockEntryModal;