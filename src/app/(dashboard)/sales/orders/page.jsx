"use client"

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faHourglassHalf, faTruck, faCheckCircle, faBoxOpen, faBan } from '@fortawesome/free-solid-svg-icons';
import OrderListTable from "@/components/sales/orders/OrderListTable";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const OrderCard = ({ title, value, icon, bgColor, textColor }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md p-4 flex flex-col justify-between min-w-[200px] ${bgColor} border border-gray-200`}>
            <div className="flex items-center mb-5">
                <FontAwesomeIcon icon={icon} className={`mr-2 ${textColor}`} />
                <h2 className={`text-gray-600 font-medium ${textColor}`}>{title}</h2>
            </div>
            <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
        </div>
    );
};

export default function OrdersPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [orderStats, setOrderStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        canceled: 0
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const first_name = localStorage.getItem('first_name');

    // Fetch orders and calculate statistics
    const fetchOrderStats = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders(router);
            if (response.status === "success") {
                const orders = response.data || [];
                
                const stats = {
                    total: orders.length,
                    pending: orders.filter(order => order.status?.toLowerCase() === 'pending').length,
                    processing: orders.filter(order => order.status?.toLowerCase() === 'processing').length,
                    shipped: orders.filter(order => order.status?.toLowerCase() === 'shipped').length,
                    delivered: orders.filter(order => order.status?.toLowerCase() === 'delivered').length,
                    canceled: orders.filter(order => order.status?.toLowerCase() === 'canceled').length
                };
                
                setOrderStats(stats);
            }
        } catch (error) {
            console.error("Error fetching order stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderStats();
        
        const updateDateTimeAndGreeting = () => {
            const now = new Date();
            const hours = now.getHours();

            if (hours >= 5 && hours < 12) {
                setGreeting('Good Morning');
            } else if (hours >= 12 && hours < 18) {
                setGreeting('Good Afternoon');
            } else {
                setGreeting('Good Evening');
            }

            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'Africa/Lagos' // WAT (West Africa Time)
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTimeAndGreeting();
        const intervalId = setInterval(updateDateTimeAndGreeting, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const formatNumber = (num) => {
        return num.toLocaleString();
    };

    if (loading) {
        return (
            <div>
                <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                    <div>
                        <h1 className='text-2xl font-bold'>Orders</h1>
                        <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                    </div>
                    <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D] bg-white'>
                        {currentDateTime}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between min-w-[200px] border border-gray-200">
                            <div className="flex items-center mb-5">
                                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mr-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </div>
                    ))}
                </div>
                <div className="mt-8">
                    <OrderListTable />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Orders</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D] bg-white'>
                    {currentDateTime}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <OrderCard
                    title="Total orders"
                    value={formatNumber(orderStats.total)}
                    icon={faShoppingCart}
                    bgColor="bg-blue-100"
                    textColor="text-blue-800"
                />
                <OrderCard
                    title="Pending orders"
                    value={formatNumber(orderStats.pending)}
                    icon={faHourglassHalf}
                    bgColor="bg-yellow-100"
                    textColor="text-yellow-800"
                />
                <OrderCard
                    title="Processing orders"
                    value={formatNumber(orderStats.processing)}
                    icon={faBoxOpen}
                    bgColor="bg-orange-100"
                    textColor="text-orange-800"
                />
                <OrderCard
                    title="Shipped orders"
                    value={formatNumber(orderStats.shipped)}
                    icon={faTruck}
                    bgColor="bg-purple-100"
                    textColor="text-purple-800"
                />
                <OrderCard
                    title="Delivered orders"
                    value={formatNumber(orderStats.delivered)}
                    icon={faCheckCircle}
                    bgColor="bg-green-100"
                    textColor="text-green-800"
                />
            </div>
            <div className="mt-8">
                <OrderListTable onOrderUpdate={fetchOrderStats} />
            </div>
        </div>
    );
}