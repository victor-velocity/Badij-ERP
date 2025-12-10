import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import apiService from "@/app/lib/apiService";
import toast from "react-hot-toast";
import { faBoxOpen, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function NewOrdersTable() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const goldColor = "#153087";

    useEffect(() => {
        const fetchProcessingOrders = async () => {
            try {
                setLoading(true);
                const response = await apiService.getOrders(router);

                if (response.status === "success") {
                    const processingOrders = (response.data || [])
                        .filter(order => order.status?.toLowerCase() === 'processing')
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5)
                        .map(order => ({
                            id: order.order_id,
                            invoice: order.order_number,
                            date: order.created_at
                                ? new Date(order.created_at).toLocaleDateString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })
                                : 'N/A',
                            rawDate: order.created_at
                        }));

                    setOrders(processingOrders);

                    if (processingOrders.length === 0) {
                        toast("No new orders to process", { icon: "info" });
                    } else {
                        toast.success(`Found ${processingOrders.length} order(s) to process`);
                    }
                } else {
                    toast.error("Failed to load orders");
                }
            } catch (err) {
                console.error("Error fetching processing orders:", err);
                toast.error("Network error");
            } finally {
                setLoading(false);
            }
        };

        fetchProcessingOrders();
    }, [router]);

    const handleProcessOrder = (orderId) => {
        router.push(`/inventory/orders?process=${orderId}`);
    };

    const handleSeeAllOrders = () => {
        router.push('/inventory/orders');
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 h-[400px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-6 h-6 text-[#153087]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">New Orders to Process</h2>
                        <p className="text-sm text-gray-500">Latest 5 processing orders</p>
                    </div>
                </div>
                <button
                    onClick={handleSeeAllOrders}
                    className="text-sm font-medium text-[#153087] hover:text-[#8a6d15] transition-colors underline-offset-2 hover:underline"
                >
                    See all →
                </button>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between animate-pulse">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                                    <div>
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
                                    </div>
                                </div>
                                <div className="h-9 w-24 bg-gray-200 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                        <FontAwesomeIcon icon={faBoxOpen} className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">All caught up!</p>
                        <p className="text-sm">No new orders to process right now</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all group border border-gray-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#153087] to-[#9a7516] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                                        {order.invoice.slice(-3)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-base">
                                            {order.invoice}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <FontAwesomeIcon icon={faCalendarAlt} className="w-3 h-3" />
                                            {order.date}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleProcessOrder(order.id)}
                                    className="px-5 py-2.5 bg-[#153087] text-white font-medium rounded-lg hover:bg-[#9a7516] transition-all transform hover:scale-105 shadow-md group-hover:shadow-lg"
                                >
                                    Process
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}