// app/humanResources/layout.js
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import NavBar from '@/components/humanResources/navBar';

export default function HRManagerLayout({ children }) {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isHRManager, setIsHRManager] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        async function checkUserAndRole() {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                toast.error('You must be logged in to access this page.');
                router.replace('/login');
                setLoading(false);
                return;
            }

            setUser(authUser);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authUser.id)
                .single();

            if (profileError) {
                console.error('Error fetching user role:', profileError.message);
                toast.error('Failed to load user role. Please try again.');
                router.replace('/login');
                setLoading(false);
                return;
            }

            if (profileData && profileData.role === 'hr_manager') {
                setIsHRManager(true);
            } else {
                toast.error('Access Denied: You do not have HR Manager privileges.');
                router.replace('/dashboard');
            }
            setLoading(false);
        }

        checkUserAndRole();
    }, [supabase, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Loading access permissions...</p>
            </div>
        );
    }

    if (isHRManager) {
        return (
            <div className="flex flex-col min-h-screen">
                <NavBar />
                <main className="flex-grow">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-red-50">
            <p className="text-xl text-red-700">Unauthorized Access. Redirecting...</p>
        </div>
    );
}