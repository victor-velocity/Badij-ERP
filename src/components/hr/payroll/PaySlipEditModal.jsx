"use client"

import { useState, useEffect, useCallback, useMemo } from "react";

const ABSENTISM_COST_PER_DAY = 3000;

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export const EditPayrollModal = ({ employee, isOpen, onClose, onSave }) => {
    const [editedDeductions, setEditedDeductions] = useState([]);
    const [editedBonusPrice, setEditedBonusPrice] = useState(0);
    const [editedIncentives, setEditedIncentives] = useState(0);
    const [editedCompensationPrice, setEditedCompensationPrice] = useState(0);
    const [editedTimesAbsent, setEditedTimesAbsent] = useState(0);

    useEffect(() => {
        if (employee) {
            const updatedDeductions = employee.deductions.map(ded =>
                ded.id === 'absentism' ? { ...ded, price: employee.timesAbsent * ABSENTISM_COST_PER_DAY } : ded
            );
            if (!updatedDeductions.find(ded => ded.id === 'absentism')) {
                updatedDeductions.push({ id: 'absentism', name: 'Absentism', price: employee.timesAbsent * ABSENTISM_COST_PER_DAY, isChecked: employee.timesAbsent > 0 });
            }
            setEditedDeductions(updatedDeductions);
            setEditedBonusPrice(employee.bonusPrice);
            setEditedIncentives(employee.incentives);
            setEditedCompensationPrice(employee.compensationPrice);
            setEditedTimesAbsent(employee.timesAbsent);
        }
    }, [employee]);

    const handleDeductionPriceChange = useCallback((id, newPrice) => {
        setEditedDeductions(prevDeductions =>
            prevDeductions.map(ded =>
                ded.id === id ? { ...ded, price: parseFloat(newPrice) || 0 } : ded
            )
        );
    }, []);

    const handleDeductionToggle = useCallback((id) => {
        setEditedDeductions(prevDeductions =>
            prevDeductions.map(ded =>
                ded.id === id ? { ...ded, isChecked: !ded.isChecked } : ded
            )
        );
    }, []);

    const handleTimesAbsentChange = useCallback((e) => {
        const newTimesAbsent = parseInt(e.target.value) || 0;
        setEditedTimesAbsent(newTimesAbsent);
        setEditedDeductions(prevDeductions =>
            prevDeductions.map(ded =>
                ded.id === 'absentism'
                    ? { ...ded, price: newTimesAbsent * ABSENTISM_COST_PER_DAY, isChecked: newTimesAbsent > 0 }
                    : ded
            )
        );
    }, []);

    const totalDeductions = useMemo(() => {
        return editedDeductions.reduce((sum, ded) => sum + (ded.isChecked ? ded.price : 0), 0);
    }, [editedDeductions]);

    const netSalary = useMemo(() => {
        if (!employee) return 0;
        const totalIncome = employee.grossSalary + editedBonusPrice + editedIncentives + editedCompensationPrice;
        return totalIncome - totalDeductions;
    }, [employee, editedBonusPrice, editedIncentives, editedCompensationPrice, totalDeductions]);

    const handleSave = () => {
        onSave(employee.id, editedDeductions, editedBonusPrice, editedIncentives, editedCompensationPrice, editedTimesAbsent);
        onClose();
    };

    if (!isOpen || !employee) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl w-full max-w-lg p-8 transform transition-all duration-300 scale-100 opacity-100">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Edit Payroll for <span className="text-[#b88b1b]">{employee.name}</span></h2>

                <div className="space-y-6 mb-8">
                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Income Details</h3>
                        <p className="text-lg font-semibold text-gray-700 mb-4">Gross Salary: {formatCurrency(employee.grossSalary)}</p>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="bonus-price" className="text-md font-medium text-gray-700">Bonus Price:</label>
                                <input
                                    type="number"
                                    id="bonus-price"
                                    value={editedBonusPrice}
                                    onChange={(e) => setEditedBonusPrice(parseFloat(e.target.value) || 0)}
                                    className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] text-right text-lg font-semibold"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="incentives" className="text-md font-medium text-gray-700">Incentives:</label>
                                <input
                                    type="number"
                                    id="incentives"
                                    value={editedIncentives}
                                    onChange={(e) => setEditedIncentives(parseFloat(e.target.value) || 0)}
                                    className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] text-right text-lg font-semibold"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="compensation-price" className="text-md font-medium text-gray-700">Compensation Price:</label>
                                <input
                                    type="number"
                                    id="compensation-price"
                                    value={editedCompensationPrice}
                                    onChange={(e) => setEditedCompensationPrice(parseFloat(e.target.value) || 0)}
                                    className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] text-right text-lg font-semibold"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Deductions</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                <label className="flex items-center flex-grow cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-5 w-5 text-[#b88b1b] rounded focus:ring-[#b88b1b]"
                                        checked={editedDeductions.find(d => d.id === 'absentism')?.isChecked || false}
                                        onChange={() => handleDeductionToggle('absentism')}
                                    />
                                    <span className="ml-3 text-gray-700 font-medium">Absentism</span>
                                </label>
                                <input
                                    type="number"
                                    value={editedTimesAbsent}
                                    onChange={handleTimesAbsentChange}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#b88b1b] text-right text-md"
                                    min="0"
                                />
                                <span className="ml-2 text-gray-500 text-sm">days ({formatCurrency(editedTimesAbsent * ABSENTISM_COST_PER_DAY)})</span>
                            </div>

                            {editedDeductions.filter(ded => ded.id !== 'absentism').map((deduction) => (
                                <div key={deduction.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                                    <label className="flex items-center flex-grow cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-5 w-5 text-[#b88b1b] rounded focus:ring-[#b88b1b]"
                                            checked={deduction.isChecked}
                                            onChange={() => handleDeductionToggle(deduction.id)}
                                        />
                                        <span className="ml-3 text-gray-700 font-medium">{deduction.name}</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={deduction.price}
                                        onChange={(e) => handleDeductionPriceChange(deduction.id, e.target.value)}
                                        className="w-36 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] text-right text-lg font-semibold"
                                        disabled={!deduction.isChecked}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mt-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Total Deductions:</span>
                        <span className="text-xl font-bold text-red-600">{formatCurrency(totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-900">Net Salary:</span>
                        <span className="text-2xl font-bold text-green-600">{formatCurrency(netSalary)}</span>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-[#b88b1b] text-white font-semibold rounded-lg shadow-md hover:bg-[#a37a1a] focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:ring-opacity-75 transition-all duration-200"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};