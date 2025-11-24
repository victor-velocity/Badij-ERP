// app/(dashboard)/sales/page.jsx or components/sales/SalesOverview.jsx
"use client";

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDollarSign,
    faShoppingCart,
    faUserPlus,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import RevenueTrendChart from "@/components/sales/RevenueTrendChart";
import TopSellingProducts from "@/components/sales/TopSellingProducts";
import RecentOrders from "@/components/sales/RecentOrders";

const MetricCard = ({ title, value, icon }) => {
    const getIconColor = (title) => {
        switch (title) {
            case 'Total Revenue': return '#10B981';
            case 'Total Orders': return '#3B82F6';
            case 'New Customers': return '#EF4444';
            case 'Conversion Rate': return '#8B5CF6';
            default: return '#6B7280';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <FontAwesomeIcon
                    icon={icon}
                    className="text-2xl"
                    style={{ color: getIconColor(title) }}
                />
            </div>
            <div>
                <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );
};

const SalesOverview = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        newCustomers: 0,
        conversionRate: "0%"
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const first_name = localStorage.getItem('first_name') || "User";

    useEffect(() => {
        const updateDateTimeAndGreeting = () => {
            const now = new Date();
            const hours = now.getHours();

            if (hours >= 5 && hours < 12) setGreeting('Good Morning');
            else if (hours >= 12 && hours < 18) setGreeting('Good Afternoon');
            else setGreeting('Good Evening');

            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
                timeZone: 'Africa/Lagos'
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTimeAndGreeting();
        const intervalId = setInterval(updateDateTimeAndGreeting, 1000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const fetchSalesMetrics = async () => {
            try {
                setLoading(true);

                // Fetch all required data in parallel
                const [ordersRes, customersRes] = await Promise.all([
                    apiService.getOrders(router),
                    apiService.getCustomers(router)
                ]);

                const orders = ordersRes?.data || [];
                const customers = customersRes?.data || [];

                const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

                const totalOrders = orders.length;

                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const newCustomers = customers.filter(c => {
                    const created = new Date(c.created_at || c.date_created);
                    return created >= thirtyDaysAgo;
                }).length;

                // Conversion Rate: (Paid Orders / Total Orders) × 100
                const paidOrders = orders.filter(o => o.payment_status === 'paid').length;
                const conversionRate = totalOrders > 0
                    ? ((paidOrders / totalOrders) * 100).toFixed(1) + "%"
                    : "0%";

                setMetrics({
                    totalRevenue: totalRevenue.toLocaleString(),
                    totalOrders: totalOrders.toLocaleString(),
                    newCustomers: newCustomers.toLocaleString(),
                    conversionRate
                });

            } catch (error) {
                console.error("Error fetching sales metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSalesMetrics();
    }, [router]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-5 mb-10'>
                <div>
                    <h1 className='text-3xl font-bold text-gray-900'>Sales Overview</h1>
                    <p className='text-gray-600 font-medium mt-2'>{greeting}, {first_name}!</p>
                </div>
                <span className='bg-gray-50 rounded-2xl px-5 py-3 border border-gray-200 text-gray-600 text-sm font-medium'>
                    {currentDateTime}
                </span>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                <div className="animate-pulse">
                                    <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                                    <div className="h-8 bg-gray-300 rounded w-24"></div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <MetricCard
                            title="Total Revenue"
                            value={`₦${metrics.totalRevenue}`}
                            icon={faDollarSign}
                            changeColor="text-green-600"
                        />
                        <MetricCard
                            title="Total Orders"
                            value={`${metrics.totalOrders} orders`}
                            icon={faShoppingCart}
                            changeColor="text-green-600"
                        />
                        <MetricCard
                            title="New Customers"
                            value={`${metrics.newCustomers} new`}
                            icon={faUserPlus}
                            changeColor="text-green-600"
                        />
                        <MetricCard
                            title="Conversion Rate"
                            value={metrics.conversionRate}
                            icon={faChartLine}
                            changeColor="text-green-600"
                        />
                    </>
                )}
            </div>

            {/* Charts & Recent Orders */}
            <div className="flex flex-wrap gap-4 mt-8 items-stretch">
                <div className="flex-1 min-w-[500px] h-[400px]">
                    <RevenueTrendChart />
                </div>
                <div className="w-full md:w-1/4 min-w-[250px] h-[400px]">
                    <TopSellingProducts />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200">
                <RecentOrders />
            </div>
        </div>
    );
};

export default SalesOverview;