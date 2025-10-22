import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import apiService from "@/app/lib/apiService";
import toast from "react-hot-toast";

export function NewOrdersTable() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await apiService.getOrders(router);
                if (response.status === "success") {
                    const processingOrders = (response.data || [])
                        .filter(order => order.status?.toLowerCase() === 'processing')
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5)
                        .map(order => ({
                            invoice: order.order_number,
                            date: order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            }) : 'Not set',
                            id: order.id
                        }));
                    setOrders(processingOrders);
                    toast.success("Processing orders fetched successfully!");
                } else {
                    setError(response.message || "Failed to fetch orders");
                    toast.error(response.message || "Failed to fetch orders");
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
                setError(error.message);
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    const handleNavigateToOrders = () => {
        router.push('/orders');
    };

    const handleProcessOrder = (orderId) => {
        router.push(`/orders?process=${orderId}`);
    };

    return (
        <div className="bg-white rounded-[20px] h-[400px] overflow-y-auto p-6 shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">New Orders</h2>
                <span 
                    className="text-sm text-gray-500 cursor-pointer hover:underline transition-all hover:text-gray-700"
                    onClick={handleNavigateToOrders}
                >
                    See all
                </span>
            </div>
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice Number
                            </th>
                            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th scope="col" className="relative px-2 py-3">
                                <span className="sr-only">Process</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-2 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-2 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="px-2 py-4 whitespace-nowrap"><div className="h-8 bg-gray-200 rounded w-20"></div></td>
                                </tr>
                            ))
                        ) : orders.length > 0 ? (
                            orders.map((order, index) => (
                                <tr key={index}>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {order.invoice}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.date}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            className="px-4 py-2 rounded-md text-white font-medium transition-colors hover:bg-[#685c3e] bg-[#b88b1b]"
                                            onClick={() => handleProcessOrder(order.id)}
                                        >
                                            Process
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="px-2 py-4 text-center text-sm text-gray-500">
                                    No processing orders found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}