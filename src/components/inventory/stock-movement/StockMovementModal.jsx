"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faCheck,
    faUpload,
    faSearch
} from '@fortawesome/free-solid-svg-icons';

const goldColor = '#b88b1b';

export const StockMovementModal = ({ isOpen, onClose, initialData = null }) => {
    const [formData, setFormData] = useState({
        movementType: '',
        product: '',
        quantity: '',
        sourceDestination: '',
        referenceFile: null,
        searchTerm: '',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                movementType: initialData.movementType || '',
                product: initialData.product || '',
                quantity: initialData.quantity || '',
                sourceDestination: initialData.sourceDestination || '',
                referenceFile: initialData.referenceFile || null,
                searchTerm: initialData.searchTerm || '',
                notes: initialData.notes || ''
            });
        } else {
            setFormData({
                movementType: '',
                product: '',
                quantity: '',
                sourceDestination: '',
                referenceFile: null,
                searchTerm: '',
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, referenceFile: e.target.files[0] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Submitted:', formData);
        onClose();
    };

    const movementTypes = [
        'Information supplied',
        'Action/Discussion',
        'To customers',
        'Transfer adjustment'
    ];

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
            <div className="relative bg-white max-h-[95vh] overflow-auto rounded-2xl shadow-xl p-6 w-full max-w-2xl transform transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Add new stock movement</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <div className="flex items-center mb-2">
                            <label className="block text-md font-medium text-gray-700 mr-2">
                                Movement type
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            e.g. for information supplied, action/discussion/to customers, transfer adjustment
                        </p>
                        <select
                            name="movementType"
                            value={formData.movementType}
                            onChange={handleChange}
                            className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
                            style={{ borderColor: '#d1d5db' }}
                        >
                            <option value="">Select movement type</option>
                            {movementTypes.map((type, index) => (
                                <option key={index} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    {/* Product Selection */}
                    <div>
                        <div className="flex items-center mb-2">
                            <label className="block text-md font-medium text-gray-700 mr-2">
                                Product selection
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            Source date description (by Product ID, Name)
                        </p>
                        <div className="relative">
                            <input
                                type="text"
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none pr-10"
                                style={{ borderColor: '#d1d5db' }}
                                placeholder="Search products..."
                            />
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute right-3 top-3 text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <div className="flex items-center mb-2">
                            <label className="block text-md font-medium text-gray-700 mr-2">
                                Quantity
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            Store/to occupy in numbers and positive values only
                        </p>
                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="0"
                            className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
                            style={{ borderColor: '#d1d5db' }}
                            placeholder="Enter quantity"
                        />
                    </div>

                    {/* Source/Destination */}
                    <div>
                        <div className="flex items-center mb-2">
                            <label className="block text-md font-medium text-gray-700 mr-2">
                                Source/Destination (Depends type)
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                            e.g. for internal(symbol-in), or external(contents), for transfer, for adjustment
                        </p>
                        <input
                            type="text"
                            name="sourceDestination"
                            value={formData.sourceDestination}
                            onChange={handleChange}
                            className="w-full p-2 border rounded border-gray-400 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
                            style={{ borderColor: '#d1d5db' }}
                            placeholder="Enter source/destination"
                        />
                    </div>

                    {/* Reference Document */}
                    <div>
                        <label className="block text-md font-medium text-gray-700 mb-2">
                            Reference document (invoice, delivery note e.t.c)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                            <div className="space-y-1 text-center">
                                <FontAwesomeIcon icon={faUpload} className="mx-auto text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer rounded-md font-medium text-gold-600 hover:text-gold-500">
                                        <span className='text-[#b88b1b]'>Upload a file</span>
                                        <input
                                            type="file"
                                            className="sr-only"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">PISA_JPEG GP app SPG</p>
                            </div>
                        </div>
                    </div>

                    {/* Note/Remarks */}
                    <div>
                        <label className="block text-md font-medium text-gray-700 mb-2">
                            Notes/Remarks
                        </label>
                        <div className="flex items-center space-x-2">
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                className="w-full p-2 border rounded border-gray-300 focus:ring-[#b88b1b] focus:border-[#b88b1b] focus:ring-2 focus:outline-none"
                                placeholder="State your reason briefly..."
                            ></textarea>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 rounded-md text-gray-600 font-medium border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 rounded-md text-white font-medium"
                            style={{ backgroundColor: goldColor }}
                        >
                            Add new movement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};