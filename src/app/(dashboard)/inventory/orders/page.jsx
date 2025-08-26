"use client";

import React, { useState, useEffect } from "react";
import OrderListTable from "@/components/inventory/orders/OrderListTable";
import { StatCard } from "@/components/inventory/orders/OrderListCard";

export default function InventoryOrders() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');

    const first_name = localStorage.getItem('first_name');

    const cardData = [
        { title: "Total Products", count: "1,240 items", color: "blue", icon: "📦" },
        { title: "Low Stock", count: "27 items", color: "orange", icon: "⚠️" },
        { title: "Out of Stock", count: "50 items", color: "red", icon: "🚫" },
        { title: "Categories", count: "12 items", color: "purple", icon: "📑" }
    ];

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
                    <h1 className='text-2xl font-bold '>Orders</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
                {cardData.map((card, index) => (
                    <StatCard
                        key={index}
                        title={card.title}
                        count={card.count}
                        color={card.color}
                        icon={card.icon}
                    />
                ))}
            </div>
            
            <div>
                <OrderListTable />
            </div>
        </div>
    )
}