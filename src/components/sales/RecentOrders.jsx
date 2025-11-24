// components/dashboard/RecentOrders.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const RecentOrders = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchRecentOrders = async () => {
            try {
                setLoading(true);
                const response = await apiService.getOrders(router);

                if (response.status === "success") {
                    const allOrders = response.data || [];

                    // Sort by newest first and take latest 7
                    const recentOrders = allOrders
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 7);

                    setOrders(recentOrders);
                }
            } catch (error) {
                console.error("Error fetching recent orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentOrders();
    }, [router]);

    // Format products: show first + count of others
    const formatProducts = (orderDetails) => {
        if (!orderDetails || orderDetails.length === 0) return "No items";
        const items = orderDetails.map(d => d.product_id?.name || "Unknown Product");
        if (items.length === 1) return items[0];
        return `${items[0]} +${items.length - 1} more`;
    };

    // Format date nicely
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).replace(',', ' -');
    };

    // Status color mapping
    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        const colors = {
            pending: "text-yellow-600",
            processing: "text-orange-600",
            shipped: "text-blue-600",
            "in transit": "text-purple-600",
            delivered: "text-green-600",
            canceled: "text-red-600",
        };
        return colors[s] || "text-gray-600";
    };

    // Filter orders based on search
    const filteredOrders = orders.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatProducts(order.order_details)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDate(order.created_at)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.total_amount + "")?.includes(searchTerm)
    );

    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
                <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-xs font-medium text-gray-500 border-b border-gray-200">
                            <th className="pb-4 pt-2">Order ID</th>
                            <th className="pb-4 pt-2">Products</th>
                            <th className="pb-4 pt-2">Order Date</th>
                            <th className="pb-4 pt-2">Amount</th>
                            <th className="pb-4 pt-2 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            // Skeleton loader
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-100">
                                    <td className="py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div></td>
                                    <td className="py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></td>
                                    <td className="py-4 text-center"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto animate-pulse"></div></td>
                                </tr>
                            ))
                        ) : filteredOrders.length > 0 ? (
                            filteredOrders.map((order) => (
                                <tr key={order.order_id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="py-4 font-medium text-gray-900 font-mono">
                                        {order.order_number || `#${order.order_id}`}
                                    </td>
                                    <td className="py-4 text-gray-700">
                                        {formatProducts(order.order_details)}
                                    </td>
                                    <td className="py-4 text-gray-600">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="py-4 font-semibold text-gray-800">
                                        ₦{Number(order.total_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="py-4 text-center">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.delivery_status)} bg-opacity-10 bg-current`}>
                                            {order.delivery_status || "Pending"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-gray-500 text-sm">
                                    {searchTerm ? "No matching orders" : "No recent orders"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {orders.length >= 7 && !searchTerm && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                        Showing latest 7 of {orders.length} orders
                    </p>
                </div>
            )}
        </div>
    );
};

export default RecentOrders;