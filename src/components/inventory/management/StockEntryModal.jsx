import React, { useState, useEffect } from 'react';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';

const StockEntryModal = ({ onClose, onSuccess, importBatches = [] }) => {
    const [formData, setFormData] = useState({
        contents_type: 'product',
        content_id: '',
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
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [itemsLoading, setItemsLoading] = useState(false);

    useEffect(() => {
        loadProducts();
        loadComponents();
        loadLocations();
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
            const response = await apiService.getProducts();
            if (response.status === 'success') {
                setProducts(response.data || []);
            } else {
                toast.error('Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load products');
        }
    };

    const loadComponents = async () => {
        try {
            const response = await apiService.getComponents();
            if (response.status === 'success') {
                setComponents(response.data || []);
            } else {
                toast.error('Failed to load components');
            }
        } catch (error) {
            console.error('Error loading components:', error);
            toast.error('Failed to load components');
        }
    };

    const loadLocations = async () => {
        // You might want to create a locations API endpoint
        // For now, using a mock or you can fetch from your locations table
        try {
            // Example: const response = await apiService.getLocations();
            // setLocations(response.data || []);
            
            // Mock locations for now - replace with actual API call
            const mockLocations = [
                { location_id: 'loc-1', name: 'Warehouse A' },
                { location_id: 'loc-2', name: 'Warehouse B' },
                { location_id: 'loc-3', name: 'Cold Storage' },
            ];
            setLocations(mockLocations);
        } catch (error) {
            console.error('Error loading locations:', error);
            toast.error('Failed to load locations');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.content_id || !formData.batch_id || !formData.boxes_count) {
            toast.error('Item, batch, and boxes count are required');
            return;
        }

        if (formData.quantity_in_box < 1) {
            toast.error('Quantity per box must be at least 1');
            return;
        }

        if (formData.boxes_count < 1) {
            toast.error('Boxes count must be at least 1');
            return;
        }

        setLoading(true);

        try {
            const response = await apiService.createStockEntry(formData);
            if (response.status === 'success') {
                toast.success('Stock entry created successfully');
                onClose();
                onSuccess();
            } else {
                toast.error(response.message || 'Failed to create stock entry');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create stock entry';
            toast.error(errorMessage);
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

        // Clear content selection when content type changes
        if (name === 'contents_type') {
            setFormData(prev => ({
                ...prev,
                content_id: '',
                content_name: ''
            }));
            setSearchTerm('');
        }
    };

    const handleItemSelect = (item) => {
        const contentIdField = formData.contents_type === 'product' ? 'product_id' : 'component_id';
        
        setFormData(prev => ({
            ...prev,
            content_id: item[contentIdField],
            content_name: item.name
        }));
        setSearchTerm(item.name);
        setShowDropdown(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);

        // Clear content_id if search term is empty or doesn't match selected item
        if (e.target.value.trim() === '' || 
            (formData.content_id && !getCurrentItems().find(item => {
                const idField = formData.contents_type === 'product' ? 'product_id' : 'component_id';
                return item[idField] === formData.content_id && item.name.includes(e.target.value);
            }))) {
            setFormData(prev => ({
                ...prev,
                content_id: ''
            }));
        }
    };

    const handleDropdownBlur = () => {
        setTimeout(() => {
            setShowDropdown(false);
        }, 200);
    };

    const getSelectedItemName = () => {
        if (!formData.content_id) return searchTerm;
        const selectedItem = getCurrentItems().find(item => {
            const idField = formData.contents_type === 'product' ? 'product_id' : 'component_id';
            return item[idField] === formData.content_id;
        });
        return selectedItem ? selectedItem.name : searchTerm;
    };

    const getItemDisplay = (item) => {
        const idField = formData.contents_type === 'product' ? 'product_id' : 'component_id';
        return (
            <div>
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">
                    SKU: {item.sku} • {item.category || 'No category'}
                </div>
                {item.description && (
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Add New Stock Entry</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Content Type Selection */}
                    <div>
                        <label htmlFor="contents_type" className="block text-sm font-medium text-gray-700">
                            Content Type
                        </label>
                        <select
                            id="contents_type"
                            name="contents_type"
                            value={formData.contents_type}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                        >
                            <option value="product">Product</option>
                            <option value="component">Component</option>
                        </select>
                    </div>

                    {/* Item Search Dropdown */}
                    <div className="relative">
                        <label htmlFor="item_search" className="block text-sm font-medium text-gray-700">
                            {formData.contents_type === 'product' ? 'Product' : 'Component'}
                        </label>
                        <div className="relative mt-1">
                            <input
                                type="text"
                                id="item_search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={handleDropdownBlur}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                placeholder={`Search ${formData.contents_type}s by name or SKU...`}
                                required
                            />
                        </div>

                        {/* Dropdown List */}
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {itemsLoading ? (
                                    <div className="px-4 py-2 text-sm text-gray-500">Loading items...</div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="px-4 py-2 text-sm text-gray-500">No items found</div>
                                ) : (
                                    filteredItems.map((item) => (
                                        <div
                                            key={formData.contents_type === 'product' ? item.product_id : item.component_id}
                                            onClick={() => handleItemSelect(item)}
                                            className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                                                formData.content_id === (formData.contents_type === 'product' ? item.product_id : item.component_id) 
                                                    ? 'bg-blue-100' 
                                                    : ''
                                            }`}
                                        >
                                            {getItemDisplay(item)}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Hidden input for form submission */}
                        <input
                            type="hidden"
                            name="content_id"
                            value={formData.content_id}
                            required
                        />
                    </div>

                    {/* Selected Item Info */}
                    {formData.content_id && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <div className="text-sm text-green-800">
                                <strong>Selected:</strong> {getSelectedItemName()}
                            </div>
                        </div>
                    )}

                    {/* Import Batch Selection */}
                    <div>
                        <label htmlFor="batch_id" className="block text-sm font-medium text-gray-700">
                            Import Batch
                        </label>
                        <select
                            id="batch_id"
                            name="batch_id"
                            value={formData.batch_id}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                        >
                            <option value="">Select an import batch</option>
                            {importBatches.map((batch) => (
                                <option key={batch.batch_id} value={batch.batch_id}>
                                    {batch.batch_number} - {batch.supplier_name || 'Unknown Supplier'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity and Boxes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantity_in_box" className="block text-sm font-medium text-gray-700">
                                Quantity per Box
                            </label>
                            <input
                                type="number"
                                id="quantity_in_box"
                                name="quantity_in_box"
                                min="1"
                                value={formData.quantity_in_box}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="boxes_count" className="block text-sm font-medium text-gray-700">
                                Number of Boxes
                            </label>
                            <input
                                type="number"
                                id="boxes_count"
                                name="boxes_count"
                                min="1"
                                value={formData.boxes_count}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                required
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                        >
                            <option value="in_stock">In Stock</option>
                            <option value="sold">Sold</option>
                            <option value="damaged">Damaged</option>
                            <option value="quarantined">Quarantined</option>
                        </select>
                    </div>

                    {/* Location and Shelf */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                                Location
                            </label>
                            <select
                                id="location_id"
                                name="location_id"
                                value={formData.location_id}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            >
                                <option value="">Select location</option>
                                {locations.map((location) => (
                                    <option key={location.location_id} value={location.location_id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="shelf_code" className="block text-sm font-medium text-gray-700">
                                Shelf Code
                            </label>
                            <input
                                type="text"
                                id="shelf_code"
                                name="shelf_code"
                                value={formData.shelf_code}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                placeholder="e.g., A1-02"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    {formData.boxes_count > 0 && formData.quantity_in_box > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <div className="text-sm text-blue-800">
                                <strong>Summary:</strong> {formData.boxes_count} box(es) × {formData.quantity_in_box} items ={' '}
                                <strong>{formData.boxes_count * formData.quantity_in_box}</strong> total items
                            </div>
                        </div>
                    )}

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
                            disabled={loading || !formData.content_id || !formData.batch_id || !formData.boxes_count}
                            className="px-4 py-2 bg-[#b88b1b] text-white rounded-md transition-all hover:bg-[#b88b1b] disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Stock Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockEntryModal;