"use client"

import React, { useEffect, useState } from "react";
import { faUsers, faUserCheck, faUserTimes, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import CustomerCard from "@/components/sales/customers/CustomerCard";
import CustomerListTable from "@/components/sales/customers/CustomerTable";
import apiService from "@/app/lib/apiService";

const CustomersPage = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [customerStats, setCustomerStats] = useState({
        totalCustomers: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        totalOrders: 0
    });
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
                timeZone: 'Africa/Lagos'
            };
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        const fetchStats = async () => {
            try {
                const response = await apiService.getCustomers(null);
                const customers = response.data || [];
                const totalCustomers = customers.length;
                const activeCustomers = customers.filter(c => c.status === 'active').length;
                const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;
                setCustomerStats({
                    totalCustomers,
                    activeCustomers,
                    inactiveCustomers,
                    totalOrders: 0 // Adjust if backend provides order data
                });
            } catch (error) {
                console.error('Error fetching customers:', error.message);
            }
        };

        updateDateTimeAndGreeting();
        fetchStats();
        const intervalId = setInterval(updateDateTimeAndGreeting, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div>
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>Customers</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CustomerCard
                    title="Total customers"
                    value={customerStats.totalCustomers.toLocaleString()}
                    icon={faUsers}
                    bgColor="bg-blue-100"
                    textColor="text-blue-800"
                />
                <CustomerCard
                    title="Active customers"
                    value={customerStats.activeCustomers.toLocaleString()}
                    icon={faUserCheck}
                    bgColor="bg-green-100"
                    textColor="text-green-800"
                />
                <CustomerCard
                    title="Inactive customers"
                    value={customerStats.inactiveCustomers.toLocaleString()}
                    icon={faUserTimes}
                    bgColor="bg-red-100"
                    textColor="text-red-800"
                />
                <CustomerCard
                    title="Total orders"
                    value={customerStats.totalOrders.toLocaleString()}
                    icon={faShoppingCart}
                    bgColor="bg-purple-100"
                    textColor="text-purple-800"
                />
            </div>
            <div className="mt-8">
                <CustomerListTable />
            </div>
        </div>
    );
};

export default CustomersPage;