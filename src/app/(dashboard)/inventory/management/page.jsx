"use client";

import React, { useState, useEffect } from "react";
import ProductsTable from "@/components/inventory/management/ProductsTable";
import ComponentsTable from "@/components/inventory/management/ComponentsTable";
import { InventoryCard } from "@/components/inventory/management/InventoryCard";
import { faDollarSign, faBoxOpen, faExclamationTriangle, faBan, faCogs, faBoxes } from "@fortawesome/free-solid-svg-icons";
import apiService from "@/app/lib/apiService";

export default function InventoryOrders() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [activeTab, setActiveTab] = useState('products');
    const [inventoryStats, setInventoryStats] = useState({
        totalStockValue: 0,
        inStockProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalComponents: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const first_name = localStorage.getItem('first_name');

    useEffect(() => {
        updateDateTimeAndGreeting();
        loadInventoryStats();
        
        const intervalId = setInterval(updateDateTimeAndGreeting, 1000);
        return () => clearInterval(intervalId);
    }, []);

    const loadInventoryStats = async () => {
        try {
            setLoading(true);
            // Load products and components to calculate stats
            const [productsResponse, componentsResponse] = await Promise.all([
                apiService.getProducts(),
                apiService.getComponents()
            ]);

            if (productsResponse.status === 'success' && componentsResponse.status === 'success') {
                const products = productsResponse.data || [];
                const components = componentsResponse.data || [];

                // Calculate statistics
                const totalStockValue = products.reduce((sum, product) => 
                    sum + (product.price * (product.stock_quantity || 0)), 0
                );

                const inStockProducts = products.filter(product => 
                    (product.stock_quantity || 0) > 10
                ).length;

                const lowStockProducts = products.filter(product => {
                    const stock = product.stock_quantity || 0;
                    return stock > 0 && stock <= 10;
                }).length;

                const outOfStockProducts = products.filter(product => 
                    (product.stock_quantity || 0) === 0
                ).length;

                const totalComponents = components.length;

                setInventoryStats({
                    totalStockValue,
                    inStockProducts,
                    lowStockProducts,
                    outOfStockProducts,
                    totalComponents
                });
            } else {
                setError('Failed to load inventory data');
            }
        } catch (error) {
            console.error('Error loading inventory stats:', error);
            setError(error.message || 'Failed to load inventory statistics');
        } finally {
            setLoading(false);
        }
    };

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
            hour12: true
        };
        setCurrentDateTime(now.toLocaleString('en-US', options));
    };

    const cardData = [
        { 
            title: 'Total Stock Value', 
            value: `₦${inventoryStats.totalStockValue.toLocaleString()}`,
            borderColor: "border-4 border-solid border-green-100", 
            textColor: "text-green-800", 
            icon: faDollarSign,
            loading: loading
        },
        { 
            title: 'In Stock Products', 
            value: inventoryStats.inStockProducts.toLocaleString(),
            borderColor: "border-4 border-solid border-blue-100", 
            textColor: "text-blue-800", 
            icon: faBoxOpen,
            loading: loading
        },
        { 
            title: 'Low Stock Products', 
            value: inventoryStats.lowStockProducts.toLocaleString(),
            borderColor: "border-4 border-solid border-yellow-100", 
            textColor: "text-yellow-800", 
            icon: faExclamationTriangle,
            loading: loading
        },
        { 
            title: 'Out of Stock Products', 
            value: inventoryStats.outOfStockProducts.toLocaleString(),
            borderColor: "border-4 border-solid border-red-100", 
            textColor: "text-red-800", 
            icon: faBan,
            loading: loading
        },
        { 
            title: 'Total Components', 
            value: inventoryStats.totalComponents.toLocaleString(),
            borderColor: "border-4 border-solid border-purple-100", 
            textColor: "text-purple-800", 
            icon: faCogs,
            loading: loading
        },
    ];

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Inventory</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={loadInventoryStats}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Inventory Management</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'products'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <i className="mr-2">📦</i>
                        Products ({inventoryStats.inStockProducts + inventoryStats.lowStockProducts + inventoryStats.outOfStockProducts})
                    </button>
                    <button
                        onClick={() => setActiveTab('components')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'components'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <i className="mr-2">⚙️</i>
                        Components ({inventoryStats.totalComponents})
                    </button>
                </nav>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {cardData.map((card, index) => (
                    <InventoryCard 
                        key={index} 
                        title={card.title} 
                        value={card.value} 
                        borderColor={card.borderColor}
                        textColor={card.textColor}
                        icon={card.icon}
                        loading={card.loading}
                    />
                ))}
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end mb-4">
                <button 
                    onClick={loadInventoryStats}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                    <svg 
                        className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Loading...' : 'Refresh Stats'}
                </button>
            </div>

            {/* Content based on active tab */}
            <div>
                {activeTab === 'products' ? (
                    <ProductsTable onDataChange={loadInventoryStats} />
                ) : (
                    <ComponentsTable onDataChange={loadInventoryStats} />
                )}
            </div>
        </div>
    );
}