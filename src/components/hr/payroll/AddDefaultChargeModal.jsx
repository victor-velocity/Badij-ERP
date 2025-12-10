"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';

const AddDefaultChargeModal = ({ isOpen, onClose, onSuccess }) => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        charge_name: '',
        description: '',
        penalty_fee: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const numericPenalty = parseFloat(formData.penalty_fee);
            if (isNaN(numericPenalty)) {
                throw new Error('Penalty fee must be a valid number');
            }

            const response = await apiService.addDefaultCharge({
                ...formData,
                penalty_fee: numericPenalty
            }, router);

            toast.success('Default charge added successfully!');
            onSuccess(response);
            onClose();
        } catch (error) {
            console.error('Error adding default charge:', error);
            toast.error(error.message || 'Failed to add default charge');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Default Charge</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="charge_name" className="block text-sm font-medium text-gray-700 mb-1">
                                Charge Name
                            </label>
                            <input
                                type="text"
                                id="charge_name"
                                name="charge_name"
                                value={formData.charge_name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153087]"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153087]"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="penalty_fee" className="block text-sm font-medium text-gray-700 mb-1">
                                Penalty Fee (NGN)
                            </label>
                            <input
                                type="number"
                                id="penalty_fee"
                                name="penalty_fee"
                                value={formData.penalty_fee}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#153087]"
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#153087] text-white font-semibold rounded-lg shadow-md hover:bg-[#a37a1a] disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Charge'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDefaultChargeModal;