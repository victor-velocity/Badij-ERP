"use client"
import React, { useState } from 'react';
import AddDefaultChargeModal from './AddDefaultChargeModal';

const DefaultChargesModal = ({ charges, isOpen, onClose, refreshCharges }) => {
    const [showAddForm, setShowAddForm] = useState(false);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-lg p-8">
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">
                        Default Charges
                    </h2>

                    <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        {(charges ?? []).length > 0 ? (
                            charges.map(charge => (
                                <div key={charge.id} className="flex flex-col border-b border-gray-200 pb-4 last:border-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{charge.charge_name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{charge.description}</p>
                                        </div>
                                        <span className="text-red-600 font-medium">
                                            {new Intl.NumberFormat('en-NG', {
                                                style: 'currency',
                                                currency: 'NGN'
                                            }).format(charge.penalty_fee || 0)}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Created: {new Date(charge.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-md text-gray-500 text-center">No default charges available.</p>
                        )}
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="px-4 py-2 bg-[#153087] text-white font-semibold rounded-lg shadow-md hover:bg-[#a37a1a]"
                        >
                            Add New Charge
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            <AddDefaultChargeModal
                isOpen={showAddForm}
                onClose={() => setShowAddForm(false)}
                onSuccess={refreshCharges}
            />
        </>
    );
};

export default DefaultChargesModal;