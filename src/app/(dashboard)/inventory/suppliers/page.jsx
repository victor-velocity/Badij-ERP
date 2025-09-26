"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import SupplierTable from "@/components/inventory/suppliers/SuppliersTable";
import { SupplierCard } from "@/components/inventory/suppliers/SuppliersCard";
import apiService from "@/app/lib/apiService";

export default function InventoryOrders() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [cardData, setCardData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const first_name = localStorage.getItem('first_name');

    useEffect(() => {
        const fetchSuppliers = async () => {
            setIsLoading(true);
            try {
                const response = await apiService.getSuppliers(router);
                if (response.status === 'success') {
                    const totalSuppliers = response.data.length;
                    setCardData([
                        { title: 'Total suppliers', value: totalSuppliers.toString() }
                    ]);
                } else {
                    setError(response.message || 'Failed to fetch suppliers');
                }
            } catch (err) {
                setError('An error occurred while fetching suppliers');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuppliers();
    }, [router]);

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

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Supplier</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            {/* {isLoading && (
                <div className="text-center py-8 text-gray-500">
                    Loading supplier data...
                </div>
            )}

            {error && (
                <div className="text-center py-8 text-red-500">
                    {error}
                </div>
            )}

            {!isLoading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-14">
                    {cardData.map((card, index) => (
                        <SupplierCard key={index} title={card.title} value={card.value} />
                    ))}
                </div>
            )} */}

            <div>
                <SupplierTable />
            </div>
        </div>
    );
}