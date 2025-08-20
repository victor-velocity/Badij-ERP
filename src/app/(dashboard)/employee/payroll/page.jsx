"use client";

import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import PaymentsTable from "@/components/employee/payroll/PaymentsTable";

export default function PaymentPage() {
    const router = useRouter();
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [greeting, setGreeting] = useState('');
    const [allPayments, setAllPayments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentData, setPaymentData] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0
    });

    const [first_name, setFirstName] = useState('');

    useEffect(() => {
        // Get first_name from localStorage on client side
        if (typeof window !== 'undefined') {
            const name = localStorage.getItem('first_name');
            if (name) setFirstName(name);
        }
    }, []);

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

    useEffect(() => {
        const fetchAndProcessPayments = async () => {
            try {
                setLoading(true);
                const payments = (await apiService.getEmployeePayments(router)) || []; 
                setAllPayments(payments);
                setError(null);
            } catch (error) {
                console.error("Error fetching payments:", error);
                setError("Failed to fetch payment history.");
                setAllPayments([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchAndProcessPayments();
    }, [router]);

    useEffect(() => {
        let totalCount = 0;
        let completedCount = 0;
        let pendingCount = 0;
        let failedCount = 0;

        totalCount = allPayments.length;

        allPayments.forEach(payment => {
            switch (payment.status) {
                case "Completed":
                    completedCount++;
                    break;
                case "Pending":
                    pendingCount++;
                    break;
                case "Failed":
                    failedCount++;
                    break;
                default:
                    break;
            }
        });

        setPaymentData({
            total: totalCount,
            completed: completedCount,
            pending: pendingCount,
            failed: failedCount,
        });

    }, [allPayments]);

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleViewPayment = (paymentId) => {
        console.log(`Viewing payment with ID: ${paymentId}`);
        // You can implement navigation to payment details page
        // router.push(`/payment/${paymentId}`);
    };

    const handleUpdatePayment = (paymentId) => {
        console.log(`Updating payment with ID: ${paymentId}`);
        // You can implement payment update logic here
    };

    const renderSearchBar = (placeholder, value, onChange) => {
        return (
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-transparent"
            />
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className='flex justify-between items-center mt-5 mb-14 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold '>Payment History</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>{greeting}, {first_name}</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Total Payments</h3>
                    <p className="text-2xl font-bold">{paymentData.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Completed</h3>
                    <p className="text-2xl font-bold text-green-600">{paymentData.completed}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Pending</h3>
                    <p className="text-2xl font-bold text-yellow-600">{paymentData.pending}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Failed</h3>
                    <p className="text-2xl font-bold text-red-600">{paymentData.failed}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mt-10 mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">Payment Records</h1>
                <div className="w-full md:w-1/3">
                    {renderSearchBar('Search payments...', searchTerm, handleSearchChange)}
                </div>
            </div>

            <PaymentsTable
                payments={allPayments}
                searchTerm={searchTerm}
                onViewPayment={handleViewPayment}
                onUpdatePayment={handleUpdatePayment}
                loading={loading}
                error={error}
            />
        </div>
    );
}