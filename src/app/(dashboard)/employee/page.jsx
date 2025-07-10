"use client"

import React, { useState, useEffect } from 'react';
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient();

const EmployeeDashboard = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDateTime, setCurrentDateTime] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            setError(null);

            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            if (authError || !authUser) {
                console.error('Auth error or no user:', authError);
                router.replace('/login');
                return;
            }

            setUser(authUser);

            // Fetch employee details from your 'employees' table using the user_id
            const { data: employeeDetails, error: employeeError } = await supabase
                .from('employees')
                .select('*')
                .eq('user_id', authUser.id)
                .single();

            if (employeeError) {
                console.error('Error fetching employee details:', employeeError);
                setError('Failed to load employee profile.');
            } else if (employeeDetails) {
                setEmployeeData(employeeDetails);
            } else {
                setError('Employee profile not found for this user.');
            }
            setLoading(false);
        };

        fetchUserData();

        // Listen for auth state changes (e.g., logout)
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.replace('/login'); // Redirect to login on logout
            } else {
                fetchUserData(); // Re-fetch if session changes (e.g., after password update)
            }
        });

        return () => {
            authListener.subscription.unsubscribe(); // Clean up listener
        };
    }, [router]); // Depend on router to avoid lint warnings

    useEffect(() => {
        const updateDateTime = () => {
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
            setCurrentDateTime(now.toLocaleString('en-US', options));
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const handleLogout = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            setError('Failed to log out.');
        } else {
            router.push('/login'); // Redirect to login page
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black">
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black">
                <p className="text-black">Error: {error}</p>
                <button
                    onClick={() => router.replace('/login')}
                    className="ml-4 px-4 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-black transition-colors"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    if (!user || !employeeData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-black">
                <p className="text-black">Access denied. Please log in.</p>
                <button
                    onClick={() => router.replace('/login')}
                    className="ml-4 px-4 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-black transition-colors"
                >
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-black p-4">
            <div className='flex justify-between items-center mt-5 mb-14'>
                <div>
                    <h1 className='text-2xl font-bold text-black'>Employee Dashboard</h1>
                    <p className='text-black font-medium mt-2'>Welcome, {employeeData.first_name} {employeeData.last_name}!</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-black text-black'>
                    {currentDateTime}
                </span>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-black mb-6">
                <h2 className="text-xl font-semibold text-black mb-4">Your Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p><strong>Email:</strong> {employeeData.email}</p>
                    <p><strong>Position:</strong> {employeeData.position}</p>
                    <p><strong>Employment Status:</strong> {employeeData.employment_status}</p>
                    <p><strong>Hire Date:</strong> {formatDate(employeeData.hire_date)}</p>
                    {/* Add more employee details here as needed */}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <Link href="/dashboard/update-password">
                        <button className="w-full sm:w-auto px-6 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-black transition-colors shadow-md cursor-pointer">
                            Update Password
                        </button>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto px-6 py-2 border border-black text-black rounded-md hover:bg-black hover:text-white transition-colors cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? 'Logging out...' : 'Log Out'}
                    </button>
                </div>
            </div>

            {/* You can add more dashboard content here */}
        </div>
    );
};

export default EmployeeDashboard;
    