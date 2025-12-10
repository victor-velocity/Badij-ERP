import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';

const goldColor = '#153087';

const AssignComponentsModal = ({ product, onClose, onSave }) => {
    const router = useRouter();
    const [components, setComponents] = useState([]);
    const [selectedComponents, setSelectedComponents] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadComponents();
    }, []);

    const loadComponents = async () => {
        try {
            setLoading(true);
            const response = await apiService.getComponents();
            console.log('Components Response:', response);
            if (response.status === 'success') {
                const componentsData = response.data || [];
                console.log('Components Data:', componentsData);
                setComponents(componentsData);
                // Initialize selected components with existing assignments if any
                const initialAssignments = {};
                componentsData.forEach(component => {
                    if (component.component_id) {
                        initialAssignments[component.component_id] = {
                            quantity: 0,
                            selected: false
                        };
                    } else {
                        console.warn('Component missing component_id:', component);
                    }
                });
                // Load existing BOM assignments for the product
                if (product.component_assignments) {
                    product.component_assignments.forEach(assignment => {
                        if (assignment.component_id) {
                            initialAssignments[assignment.component_id] = {
                                quantity: assignment.quantity,
                                selected: true
                            };
                        } else {
                            console.warn('Assignment missing component_id:', assignment);
                        }
                    });
                }
                console.log('Initial Assignments:', initialAssignments);
                setSelectedComponents(initialAssignments);
            } else {
                setError(response.message || 'Failed to load components');
            }
        } catch (error) {
            console.error('Error loading components:', error);
            setError(error.message || 'Failed to load components');
        } finally {
            setLoading(false);
        }
    };

    const handleComponentToggle = (componentId) => {
        setSelectedComponents(prev => {
            const newState = {
                ...prev,
                [componentId]: {
                    ...prev[componentId],
                    selected: !prev[componentId].selected,
                    quantity: prev[componentId].selected ? 0 : prev[componentId].quantity || 1
                }
            };
            console.log('Updated selectedComponents:', newState);
            return newState;
        });
    };

    const handleQuantityChange = (componentId, value) => {
        const quantity = parseInt(value) || 0;
        if (quantity < 0) return;
        setSelectedComponents(prev => {
            const newState = {
                ...prev,
                [componentId]: {
                    ...prev[componentId],
                    quantity
                }
            };
            console.log('Updated selectedComponents after quantity change:', newState);
            return newState;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Get current assignments from product.component_assignments
            const currentAssignments = product.component_assignments || [];
            const currentComponentIds = new Set(currentAssignments.map(a => a.component_id).filter(id => id !== null && id !== undefined));
            const selectedComponentIds = new Set(
                Object.entries(selectedComponents)
                    .filter(([componentId, { selected }]) => selected && componentId)
                    .map(([componentId]) => componentId)
            );

            console.log('Current Assignments:', currentAssignments);
            console.log('Selected Component IDs:', Array.from(selectedComponentIds));
            console.log('Submitting with selectedComponents:', selectedComponents);

            // Add or update assignments
            const addPromises = Object.entries(selectedComponents)
                .filter(([componentId, { selected, quantity }]) => selected && quantity > 0 && componentId)
                .map(async ([componentId, { quantity }]) => {
                    const bomData = { component_id: componentId, quantity };
                    console.log('Sending bomData:', bomData);
                    return apiService.addComponentToBOM(product.product_id, bomData, router);
                });

            // Remove assignments for unselected or zero-quantity components
            const removePromises = currentAssignments
                .filter(assignment => 
                    assignment.component_id && 
                    (!selectedComponentIds.has(assignment.component_id) || 
                     selectedComponents[assignment.component_id]?.quantity === 0)
                )
                .map(assignment => {
                    console.log('Removing component_id:', assignment.component_id);
                    return apiService.removeComponentFromBOM(product.product_id, assignment.component_id, router);
                });

            const results = await Promise.all([...addPromises, ...removePromises]);

            console.log('API Results:', results);

            // Check if all operations were successful
            const allSuccessful = results.every(result => result.status === 'success');
            if (allSuccessful) {
                toast.success('Components assigned successfully', { duration: 4000 });
                onSave();
                onClose();
            } else {
                const errorMessage = results.find(r => r.status !== 'success')?.message || 'Failed to assign components';
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Error during component assignment:', error);
            toast.error(error.message || 'Failed to assign components');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full overflow-y-auto max-h-[80vh] relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    disabled={saving}
                >
                    <FontAwesomeIcon icon={faTimes} size="lg" />
                </button>
                
                <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: goldColor }}>
                    Assign Components to {product.name}
                </h3>

                {loading ? (
                    <div className="text-center py-8">Loading components...</div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">Error: {error}</p>
                        <button 
                            onClick={loadComponents}
                            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            disabled={saving}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                            {components.length === 0 ? (
                                <p className="text-center text-gray-500">No components available</p>
                            ) : (
                                components.map(component => (
                                    <div key={component.component_id} className="flex items-center space-x-4 p-2 border-b border-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={selectedComponents[component.component_id]?.selected || false}
                                            onChange={() => handleComponentToggle(component.component_id)}
                                            className="h-5 w-5 text-[#153087] focus:ring-[#153087] border-gray-300 rounded"
                                            disabled={saving}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{component.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {component.sku}</p>
                                        </div>
                                        {selectedComponents[component.component_id]?.selected && (
                                            <input
                                                type="number"
                                                value={selectedComponents[component.component_id].quantity}
                                                onChange={(e) => handleQuantityChange(component.component_id, e.target.value)}
                                                className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#153087] focus:border-[#153087]"
                                                min="0"
                                                disabled={saving}
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 text-white rounded-md hover:opacity-90 transition duration-200 disabled:opacity-50"
                                style={{ backgroundColor: goldColor }}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Assign Components'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AssignComponentsModal;