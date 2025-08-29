"use client";

import React, { useState, useEffect } from "react";
import { StockMovementTable } from "@/components/inventory/stock-movement/StockMovementTable";
import { StockMovementCard } from "@/components/inventory/stock-movement/StockMovementCard";

export default function InventoryOrders() {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');

    const first_name = localStorage.getItem('first_name');

    const cardData = [
        { title: 'Total stock in', value: '1240 units' },
        { title: 'Total stock out', value: '980 units' },
        { title: 'Net  stock change', value: '+250 units' },
        { title: 'Recorded movements', value: '125' },
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
                    <h1 className='text-2xl font-bold '>Stock movement</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-14">
              {cardData.map((card, index) => (
                <StockMovementCard key={index} title={card.title} value={card.value} />
              ))}
            </div>

            <div>
                <StockMovementTable />
            </div>
        </div>
    )
}