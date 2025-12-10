"use client";

import React, { useState, useEffect } from "react";
import StockLocationTable from "@/components/inventory/stock-location/StockLocationTable";
import { useRouter } from "next/navigation";
import apiService from "@/app/lib/apiService";
import { createClient } from "@/app/lib/supabase/client";

export default function StockLocationsPage() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [locations, setLocations] = useState([]);
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [locationData, setLocationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const router = useRouter();
    const supabase = createClient();
    const first_name = localStorage.getItem('first_name');

    useEffect(() => {
        const fetchLocations = async () => {
            const { data, error } = await supabase.from('locations').select('id, name');
            if (error) {
                console.error('Error loading locations:', error);
                return;
            }
            setLocations(data || []);
            if (data && data.length > 0) {
                setSelectedLocationId(data[0].id);
            }
        };

        fetchLocations();
    }, [supabase]);

    useEffect(() => {
        const fetchLocationData = async () => {
            if (!selectedLocationId) return;

            try {
                setLoading(true);
                const stockData = await apiService.getStockByLocation(selectedLocationId, router);
                setLocationData(stockData);
            } catch (err) {
                console.error("Error fetching location data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLocationData();
    }, [selectedLocationId, router]);

    useEffect(() => {
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

        updateDateTimeAndGreeting();
        const intervalId = setInterval(updateDateTimeAndGreeting, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const handleLocationChange = (event) => {
        setSelectedLocationId(event.target.value);
    };

    // Calculate card data based on location data
    const getCardData = () => {
        if (!locationData?.data) return [];

        const products = locationData.data.products || [];
        const components = locationData.data.components || [];
        
        const totalProducts = products.length;
        const totalComponents = components.length;
        const totalItems = totalProducts + totalComponents;
        
        const totalStockQuantity = products.reduce((sum, product) => sum + (product.stock_quantity || 0), 0) +
                                 components.reduce((sum, component) => sum + (component.stock_quantity || 0), 0);

        return [
            {
                title: 'Total Items',
                value: totalItems.toString(),
                icon: '📦',
                color: 'bg-green-400',
                textColor: 'text-white'
            },
            {
                title: 'Total Stock Quantity',
                value: totalStockQuantity.toString(),
                icon: '📊',
                color: 'bg-purple-400',
                textColor: 'text-white'
            },
            {
                title: 'Products',
                value: totalProducts.toString(),
                icon: '🛍️',
                color: 'bg-indigo-400',
                textColor: 'text-white'
            },
            {
                title: 'Components',
                value: totalComponents.toString(),
                icon: '⚙️',
                color: 'bg-orange-400',
                textColor: 'text-white'
            }
        ];
    };

    const LocationCard = ({ title, value, icon, color, textColor }) => (
        <div className={`rounded-lg shadow-lg px-5 py-8 ${color} ${textColor} transition-transform hover:scale-105`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium opacity-90">{title}</h3>
                    <p className="text-2xl font-bold mt-2">{value}</p>
                </div>
                <div className="text-3xl">
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-8 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Stock Locations</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            {/* Location Selector */}
            <div className="mb-8">
                <label htmlFor="location-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Location:
                </label>
                <select
                    id="location-select"
                    value={selectedLocationId}
                    onChange={handleLocationChange}
                    className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#153087] focus:border-[#153087]"
                >
                    <option value="">Select a location</option>
                    {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                            {location.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading && selectedLocationId && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#153087] mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading location data...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Location Cards */}
            {locationData && !loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {getCardData().map((card, index) => (
                        <LocationCard 
                            key={index}
                            title={card.title}
                            value={card.value}
                            icon={card.icon}
                            color={card.color}
                            textColor={card.textColor}
                        />
                    ))}
                </div>
            )}

            {/* Stock Table */}
            {locationData && !loading && (
                <div className="">
                    <h2 className="text-xl font-bold mb-4">Stock Details</h2>
                    <StockLocationTable 
                        products={locationData.data?.products || []}
                        components={locationData.data?.components || []}
                    />
                </div>
            )}

            {!selectedLocationId && !loading && (
                <div className="text-center py-8 text-gray-500">
                    Please select a location to view stock data
                </div>
            )}
        </div>
    );
}