// Create this file at: src/components/employee/payment/PaymentsTable.jsx
"use client";

import React from "react";

const PaymentsTable = ({ payments, searchTerm, onViewPayment, onUpdatePayment, loading, error }) => {
    // Filter payments based on search term
    const filteredPayments = payments.filter(payment => 
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.amount && payment.amount.toString().includes(searchTerm)) ||
        (payment.status && payment.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.date && payment.date.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#153087]"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex justify-center items-center h-64 text-red-500">
                    {error}
                </div>
            </div>
        );
    }

    if (filteredPayments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex justify-center items-center h-64 text-gray-500">
                    No payment records found.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPayments.map((payment) => (
                            <tr key={payment.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {payment.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${payment.amount}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {payment.date}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${payment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                        payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'}`}>
                                        {payment.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => onViewPayment(payment.id)}
                                        className="text-[#153087] hover:text-[#a07c15] mr-3"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => onUpdatePayment(payment.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        Update
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentsTable;