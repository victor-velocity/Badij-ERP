"use client"

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart, faHourglassHalf, faTruck, faCheckCircle, faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import OrderListTable from "@/components/sales/orders/OrderListTable";

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

    const first_name = localStorage.getItem('first_name');

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
                hour12: true,
                timeZone: 'Africa/Lagos' // WAT (West Africa Time)
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
                    value="1,250"
                    icon={faShoppingCart}
                    bgColor="bg-blue-100"
                    textColor="text-blue-800"
                />
                <OrderCard
                    title="Pending orders"
                    value="320"
                    icon={faHourglassHalf}
                    bgColor="bg-yellow-100"
                    textColor="text-yellow-800"
                />
                <OrderCard
                    title="In transit orders"
                    value="250"
                    icon={faTruck}
                    bgColor="bg-purple-100"
                    textColor="text-purple-800"
                />
                <OrderCard
                    title="Completed orders"
                    value="870"
                    icon={faCheckCircle}
                    bgColor="bg-green-100"
                    textColor="text-green-800"
                />
                <OrderCard
                    title="Ready for dispatch"
                    value="60"
                    icon={faBoxOpen}
                    bgColor="bg-orange-100"
                    textColor="text-orange-800"
                />
            </div>
            <div className="mt-8">
                <OrderListTable />
            </div>
        </div>
    );
}