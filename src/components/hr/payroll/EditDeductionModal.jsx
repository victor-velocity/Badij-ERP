"use client"

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const EditDeductionModal = ({
    isOpen,
    onClose,
    deduction,
    onSuccess
}) => {
    const [formData, setFormData] = useState({
        instances: 1,
        pardoned_fee: 0,
        reason: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (deduction) {
            setFormData({
                instances: deduction.instances || 1,
                pardoned_fee: deduction.pardoned_fee || 0,
                reason: deduction.reason || ''
            });
        }
    }, [deduction]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'instances' || name === 'pardoned_fee'
                ? parseInt(value) || 0
                : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!deduction) return;

        if (formData.instances <= 0) {
            toast.error("Please enter a valid number of instances.");
            return;
        }

        if (formData.pardoned_fee < 0) {
            toast.error("Pardoned fee cannot be negative.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData
            };

            await apiService.updateDeduction(deduction.id, payload, router);
            onSuccess();
            toast.success("Deduction updated successfully!");
            onClose();
        } catch (error) {
            toast.error("Failed to update deduction. Please try again.");
            console.error("Error updating deduction:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !deduction) return null;

    const chargeName = deduction.default_charge?.charge_name || "Unknown Charge";
    const penaltyFee = deduction.default_charge?.penalty_fee || 0;
    const originalFee = penaltyFee * formData.instances; // Changed to use formData.instances
    const finalFee = originalFee - formData.pardoned_fee;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000aa] bg-opacity-50">
            <div className="bg-white max-h-[90vh] overflow-y-auto rounded-xl shadow-lg w-full max-w-md p-6 mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Edit Deduction</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Read-only charge info */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Charge
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                            {chargeName} ({formatCurrency(penaltyFee)})
                        </div>
                    </div>

                    {/* Instances input */}
                    <div className="mb-4">
                        <label htmlFor="instances" className="block text-sm font-medium text-gray-700 mb-1">
                            Instances
                        </label>
                        <input
                            type="number"
                            id="instances"
                            name="instances"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153087]"
                            value={formData.instances}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>

                    {/* Pardoned fee input */}
                    <div className="mb-4">
                        <label htmlFor="pardoned_fee" className="block text-sm font-medium text-gray-700 mb-1">
                            Pardoned Fee
                        </label>
                        <input
                            type="number"
                            id="pardoned_fee"
                            name="pardoned_fee"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153087]"
                            value={formData.pardoned_fee}
                            onChange={handleChange}
                            min="0"
                            max={originalFee}
                            required
                        />
                    </div>

                    {/* Reason textarea */}
                    <div className="mb-4">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Reason
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            className="w-full px-3 py-2 border resize-none border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#153087]"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Enter reason"
                            required
                            rows={3}
                        />
                    </div>

                    {/* Fee calculation summary */}
                    <div className="mb-4 space-y-2 p-3 bg-gray-100 rounded-lg">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Original Fee:</span>
                            <span>{formatCurrency(originalFee)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Pardoned Amount:</span>
                            <span className="text-red-600">-{formatCurrency(formData.pardoned_fee)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2">
                            <span className="text-sm">Final Deduction:</span>
                            <span>{formatCurrency(finalFee)}</span>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-2 text-gray-700 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 text-white bg-[#153087] rounded-lg font-semibold hover:bg-[#a37a1a] transition-colors
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDeductionModal;