"use client"

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

const AddDeductionModal = ({ isOpen, onClose, defaultCharges, employeeId, onAddDeduction }) => {
    const router = useRouter();
    const [selectedChargeId, setSelectedChargeId] = useState('');
    const [instances, setInstances] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedChargeId('');
            setInstances(1);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedChargeId || !instances || instances <= 0) {
            toast.error("Please select a charge and enter a valid number of instances.");
            return;
        }

        setIsSaving(true);
        try {
            const selectedCharge = defaultCharges.find(charge => charge.id === selectedChargeId);
            if (!selectedCharge) {
                toast.error("Selected charge not found.");
                setIsSaving(false);
                return;
            }

            const deductionData = {
                default_charge_id: selectedCharge.id,
                instances: instances,
                employee_id: employeeId
            };

            await apiService.addDeduction(deductionData, router);
            
            const newDeduction = {
                id: selectedCharge.id,
                name: selectedCharge.charge_name,
                price: (selectedCharge.penalty_fee || 0) * instances
            };
            onAddDeduction(employeeId, newDeduction);
            
            toast.success("Deduction added successfully.");
            onClose();
        } catch (error) {
            toast.error("Failed to add deduction. Please try again.");
            console.error("Error adding deduction:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const selectedCharge = defaultCharges.find(charge => charge.id === selectedChargeId);
    
    const totalFee = selectedCharge ? selectedCharge.penalty_fee * instances : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000aa] bg-opacity-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Add Deduction</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="charge-select" className="block text-sm font-medium text-gray-700 mb-1">
                            Select Charge
                        </label>
                        <select
                            id="charge-select"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            value={selectedChargeId}
                            onChange={(e) => setSelectedChargeId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose a charge --</option>
                            {defaultCharges.map(charge => (
                                <option key={charge.id} value={charge.id}>
                                    {charge.charge_name} ({formatCurrency(charge.penalty_fee)})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="instances-input" className="block text-sm font-medium text-gray-700 mb-1">
                            Instances
                        </label>
                        <input
                            type="number"
                            id="instances-input"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            value={instances}
                            onChange={(e) => setInstances(parseInt(e.target.value) || 0)}
                            min="1"
                            required
                        />
                    </div>
                    
                    {/* Display the calculated price to avoid NaN */}
                    <div className="mb-4 text-center p-3 bg-gray-100 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Deduction:</span>
                        <span className="ml-2 text-lg font-bold text-gray-900">
                            {formatCurrency(totalFee)}
                        </span>
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
                            className={`px-4 py-2 text-white bg-[#b88b1b] rounded-lg font-semibold hover:bg-[#a37a1a] transition-colors
                                ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Adding...' : 'Add Deduction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDeductionModal;
