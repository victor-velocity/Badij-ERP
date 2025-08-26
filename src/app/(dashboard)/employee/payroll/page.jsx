"use client";

import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

export default function PaymentPage() {
    const router = useRouter();
    const [allPayments, setAllPayments] = useState([]);
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmployeeAndPayments = async () => {
            try {
                setLoading(true);
                
                // Get the current employee data
                const employee = await apiService.getEmployees(router);
                
                if (!employee) {
                    throw new Error("No employee data found");
                }
                
                setEmployeeData(employee);
                
                // Fetch payments using the employee ID
                let payments = [];
                
                try {
                    payments = await apiService.getEmployeePaymentById(employee.id, router) || [];
                } catch (apiError) {
                    console.error("Error with employee.id parameter:", apiError);
                    
                    try {
                        payments = await apiService.getEmployeePaymentById(employee.shift_id, router) || [];
                    } catch (secondError) {
                        console.error("Error with shift_id parameter:", secondError);
                        throw new Error("Failed to fetch payments with available parameters");
                    }
                }
                
                setAllPayments(payments);
                setError(null);
                
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to fetch payment history: " + error.message);
                setAllPayments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeeAndPayments();
    }, [router]);

    // Skeleton Loading Component
    const SkeletonLoader = () => (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Employee Information Skeleton */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-300 mr-4 animate-pulse"></div>
                        <div className="space-y-2">
                            <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
                            <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Payment Table Skeleton */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="h-7 bg-gray-300 rounded w-40 mb-6 animate-pulse"></div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[1, 2, 3, 4].map((item) => (
                                        <th key={item} className="px-6 py-3">
                                            <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {[1, 2, 3, 4, 5].map((row) => (
                                    <tr key={row}>
                                        {[1, 2, 3, 4].map((cell) => (
                                            <td key={cell} className="px-6 py-4">
                                                <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <SkeletonLoader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                    <div className="text-red-500 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-medium mt-4">Error</h3>
                        <p className="mt-2">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Employee Information Card */}
                {employeeData && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-center mb-4">
                            {employeeData.avatar_url && (
                                <img 
                                    src={employeeData.avatar_url} 
                                    alt="Employee Avatar" 
                                    className="w-16 h-16 rounded-full object-cover mr-4"
                                />
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    {employeeData.first_name} {employeeData.last_name}
                                </h1>
                                <p className="text-gray-600">{employeeData.position}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Details Table */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Payment History</h2>
                    
                    {allPayments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hours
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allPayments.map((payment, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {payment.date || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {payment.description || 'Payment'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {payment.hours || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                                ${payment.amount ? payment.amount.toFixed(2) : '0.00'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                            Total:
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            ${allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-600 mt-4">No Payment Records Found</h3>
                            <p className="text-gray-500">No payment records available for your account.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}