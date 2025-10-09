"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faPlus } from "@fortawesome/free-solid-svg-icons";
import apiService from "@/app/lib/apiService";
import toast from 'react-hot-toast';

const AddComponentModal = ({ onClose, onSuccess, productId, components }) => {
    const [formData, setFormData] = useState({
        component_id: '',
        required_quantity: 1
    });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredComponents, setFilteredComponents] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredComponents(components);
        } else {
            const filtered = components.filter(comp =>
                comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                comp.sku?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredComponents(filtered);
        }
    }, [searchTerm, components]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleComponentSelect = (comp) => {
        setFormData(prev => ({
            ...prev,
            component_id: comp.component_id
        }));
        setSearchTerm(comp.name);
        setShowDropdown(false);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setShowDropdown(true);
        if (e.target.value.trim() === '') {
            setFormData(prev => ({ ...prev, component_id: '' }));
        }
    };

    const handleDropdownBlur = () => {
        setTimeout(() => setShowDropdown(false), 200);
    };

    const getSelectedComponentName = () => {
        if (!formData.component_id) return searchTerm;
        const selected = components.find(c => c.component_id === formData.component_id);
        return selected ? selected.name : searchTerm;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.component_id || formData.required_quantity < 1) {
            toast.error('Component and required quantity are required');
            return;
        }
        setLoading(true);
        try {
            // Assume apiService.addProductComponent exists; adjust as needed
            const response = await apiService.addProductComponent({
                product_id: productId,
                component_id: formData.component_id,
                required_quantity: formData.required_quantity
            });
            if (response.status === 'success') {
                toast.success('Component added successfully');
                onSuccess();
            } else {
                toast.error('Failed to add component');
            }
        } catch (error) {
            toast.error('Error adding component');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Add Component to Product</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">Component</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={handleDropdownBlur}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Search components..."
                            required
                        />
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                {filteredComponents.length === 0 ? (
                                    <div className="px-4 py-2 text-sm text-gray-500">No components found</div>
                                ) : (
                                    filteredComponents.map(comp => (
                                        <div
                                            key={comp.component_id}
                                            onClick={() => handleComponentSelect(comp)}
                                            className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                                        >
                                            {comp.name} (SKU: {comp.sku})
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    {formData.component_id && (
                        <div className="bg-green-50 p-2 rounded">
                            Selected: {getSelectedComponentName()}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Required Quantity</label>
                        <input
                            type="number"
                            name="required_quantity"
                            min="1"
                            value={formData.required_quantity}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-[#b88b1b] text-white rounded">
                            {loading ? 'Adding...' : 'Add Component'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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

export default function StocksTable() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState({});
    const [showAddComponentModal, setShowAddComponentModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [components, setComponents] = useState([]);

    useEffect(() => {
        loadStockSummary();
        loadComponents();
    }, []);

    const loadComponents = async () => {
        try {
            const response = await apiService.getComponents();
            if (response.status === 'success') {
                setComponents(response.data || []);
            }
        } catch (error) {
            console.error('Error loading components:', error);
        }
    };

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
                setItems([...productItems, ...componentItems]);
            } else {
                setError('Failed to load stock summary');
                toast.error('Failed to load stock summary');
                setItems([]);
            }
        } catch (error) {
            console.error('Error loading stock summary:', error);
            setError('Failed to load stock summary');
            toast.error('Failed to load stock summary');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpanded = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddComponent = (productId) => {
        setSelectedProductId(productId);
        setShowAddComponentModal(true);
    };

    const handleAddComponentSuccess = () => {
        setShowAddComponentModal(false);
        loadStockSummary();
    };

    const typeColors = {
        product: 'bg-purple-100 text-purple-800',
        component: 'bg-orange-100 text-orange-800'
    };

    return (
        <div>
            {/* Error Message */}
            {error && (
                <div className=" bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

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
                            Array.from({ length: 5 }).map((_, index) => <SkeletonRow key={index} />)
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No stock entries found
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
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
                                            {item.type === 'product' && (
                                                <div className="flex items-center gap-3 flex-nowrap">
                                                    <button
                                                        onClick={() => handleAddComponent(item.id)}
                                                        className="bg-[#b88b1b] text-white px-2 py-2 rounded-lg text-xs hover:bg-[#856515] flex items-center"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} />
                                                    </button>
                                                    {item.components_needed.length > 0 && (
                                                        <button
                                                            onClick={() => toggleExpanded(item.id)}
                                                            className="text-[#b88b1b] hover:text-[#69500f] p-1 rounded hover:bg-amber-100"
                                                            title={expanded[item.id] ? "Hide Components" : "Show Components"}
                                                        >
                                                            <FontAwesomeIcon icon={expanded[item.id] ? faChevronUp : faChevronDown} />
                                                        </button>
                                                    )}
                                                </div>
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

            {showAddComponentModal && (
                <AddComponentModal
                    onClose={() => setShowAddComponentModal(false)}
                    onSuccess={handleAddComponentSuccess}
                    productId={selectedProductId}
                    components={components}
                />
            )}
        </div>
    );
}