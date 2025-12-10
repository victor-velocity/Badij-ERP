"use client"
import React, { useMemo, useState } from 'react';
import apiService from '@/app/lib/apiService';
import toast from 'react-hot-toast';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
};

const PayslipConfirmationModal = ({ employee, isOpen, onClose, onConfirm }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const totalIncome = useMemo(() => {
        if (!employee) return 0;
        return (employee.grossSalary || 0) +
               (employee.bonus || 0) + 
               (employee.incentives || 0) +
               (employee.compensation || 0);
    }, [employee]);

    const totalDeductions = useMemo(() => {
        if (!employee) return 0;
        return (employee.deductions || []).reduce((sum, deduction) => {
            return sum + (deduction?.price || 0);
        }, 0);
    }, [employee]);

    const netSalary = totalIncome - totalDeductions;

    const handleConfirm = async () => {
        if (!employee) return;
        
        setIsLoading(true);
        try {
            await apiService.generateEmployeePayment(employee.id);
            
            toast.success('Payslip generated successfully!');
            
            if (onConfirm) {
                onConfirm();
            }
        } catch (error) {
            console.error("Error generating payment:", error);
            toast.error(`Failed to generate payslip. Try again!`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto w-full max-w-lg p-8">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">
                    Confirm Payslip for <span className="text-[#153087]">{employee.name}</span>
                </h2>

                {/* Income Section */}
                <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <p className="text-lg font-semibold text-gray-800 flex justify-between">
                        <span>Gross Salary:</span>
                        <span>{formatCurrency(employee.grossSalary)}</span>
                    </p>
                    <p className="text-md text-gray-700 flex justify-between">
                        <span>Bonus:</span>
                        <span>{formatCurrency(employee.bonus)}</span>
                    </p>
                    <p className="text-md text-gray-700 flex justify-between">
                        <span>Incentives:</span>
                        <span>{formatCurrency(employee.incentives)}</span>
                    </p>
                    <p className="text-md text-gray-700 flex justify-between">
                        <span>Compensation:</span>
                        <span>{formatCurrency(employee.compensation)}</span>
                    </p>
                    <hr className="my-3 border-gray-200" />
                    <p className="text-xl font-bold text-gray-900 flex justify-between">
                        <span>Total Income:</span>
                        <span>{formatCurrency(totalIncome)}</span>
                    </p>
                </div>

                {/* Deductions Section */}
                <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Deductions</h3>
                    {(employee.deductions || []).length > 0 ? (
                        (employee.deductions || []).map(deduction => (
                            <div key={deduction.id} className="flex flex-col">
                                <p className="text-md text-gray-700 flex justify-between">
                                    <span>
                                        {deduction.name || "Unknown Deduction"} 
                                        {deduction.instances > 1 && ` (${deduction.instances} instances)`}
                                    </span>
                                    <span className="text-red-600">
                                        {formatCurrency(deduction.price)}
                                    </span>
                                </p>
                                {deduction.pardoned_fee > 0 && (
                                    <p className="text-xs text-green-600 text-right">
                                        Pardoned: {formatCurrency(deduction.pardoned_fee)}
                                    </p>
                                )}
                                {deduction.reason && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Reason: {deduction.reason}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-md text-gray-500">No deductions applied.</p>
                    )}
                    <hr className="my-3 border-gray-200" />
                    <p className="text-xl font-bold text-gray-900 flex justify-between">
                        <span>Total Deductions:</span>
                        <span className="text-red-600">{formatCurrency(totalDeductions)}</span>
                    </p>
                </div>

                {/* Net Salary Section */}
                <div className="border-t border-gray-200 pt-6 mt-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Net Salary:</span>
                        <span className="text-xl font-bold text-green-600">{formatCurrency(netSalary)}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="px-6 py-2 bg-[#153087] text-white font-semibold rounded-lg shadow-md hover:bg-[#a37a1a] focus:outline-none focus:ring-2 focus:ring-[#153087] focus:ring-opacity-75 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            "Confirm and Generate Payslip"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayslipConfirmationModal;