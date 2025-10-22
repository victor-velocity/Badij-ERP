"use client";

import React, { useState, useEffect, useRef } from "react";
import { InventoryCard } from "@/components/inventory/DashboardCard";
import { NewOrdersTable } from "@/components/inventory/NewOrdersTable";
import { TopSellingProducts } from "@/components/inventory/TopSellingProducts";
import { RecentTransactionsTable } from "@/components/inventory/RecentTransactionsTable";
import { faBoxOpen, faExclamationTriangle, faBan, faList } from "@fortawesome/free-solid-svg-icons";

export default function InventoryDashboard() {
    const [greeting, setGreeting] = useState('');
    const timeRef = useRef(null);

    const first_name = localStorage.getItem('first_name');

    const inventoryData = [
        { title: "Total Products", count: "1,240", borderColor: "border-4 border-solid border-blue-100", textColor: "text-blue-800", icon: faBoxOpen },
        { title: "Low Stock", count: "27", borderColor: "border-4 border-solid border-yellow-100", textColor: "text-yellow-800", icon: faExclamationTriangle },
        { title: "Out of Stock", count: "50", borderColor: "border-4 border-solid border-red-100", textColor: "text-red-800", icon: faBan },
        { title: "Categories", count: "12", borderColor: "border-4 border-solid border-green-100", textColor: "text-green-800", icon: faList }
    ];

    useEffect(() => {
        const updateGreeting = () => {
            const now = new Date();
            const hours = now.getHours();
            const newGreeting = hours >= 5 && hours < 12 ? 'Good Morning' :
                               hours >= 12 && hours < 18 ? 'Good Afternoon' : 'Good Evening';
            setGreeting(prev => prev !== newGreeting ? newGreeting : prev);
        };

        const updateTimeDisplay = () => {
            const now = new Date();
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
            if (timeRef.current) {
                timeRef.current.textContent = now.toLocaleString('en-US', options);
            }
        };

        updateGreeting();
        updateTimeDisplay();

        const intervalId = setInterval(() => {
            updateGreeting();
            updateTimeDisplay();
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Overview</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]' ref={timeRef}></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {inventoryData.map((item, index) => (
                    <InventoryCard
                        key={index}
                        title={item.title}
                        count={item.count}
                        borderColor={item.borderColor}
                        textColor={item.textColor}
                        icon={item.icon}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <NewOrdersTable />
                </div>
                <div>
                    <TopSellingProducts />
                </div>
            </div>

            <div className="mt-10">
                <RecentTransactionsTable />
            </div>
        </div>
    );
}