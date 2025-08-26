'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import SideNavBar from '@/components/hr/NavBar';
import Loading from '@/components/Loading';
import TopNavBar from '@/components/hr/TopNav';

export default function HRManagerLayout({ children }) {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [isHRManager, setIsHRManager] = useState(false);
    const [profile, setProfile] = useState(null); 
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedState = localStorage.getItem('navbarExpanded');
            return savedState ? JSON.parse(savedState) : true;
        }
        return true;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('navbarExpanded', JSON.stringify(isDesktopSidebarExpanded));
        }
    }, [isDesktopSidebarExpanded]);

    useEffect(() => {
        async function checkUserAndRole() {
            setLoading(true);
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.replace('/login');
                toast.error('You must be logged in to access this page.');
                setLoading(false);
                localStorage.removeItem('user_id')
                return;
            }

            localStorage.setItem('user_id', authUser.id)

            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('id, first_name, last_name, email, user_id')
                .eq('user_id', authUser.id)
                .single();

            if (employeeError || !employeeData) {
                console.error('Error fetching employee profile:', employeeError?.message || 'Employee data not found.');
                toast.error('Failed to load employee profile. Please ensure your employee record exists.');
                router.replace('/login');
                setLoading(false);
                return;
            }

            const userRole = authUser.app_metadata?.role;
            
            const employeeFullName = `${employeeData.first_name} ${employeeData.last_name}`;
            const employeeUsername = employeeData.email.split('@')[0];
            const employeeAvatarUrl = employeeData.avatar_url || "/default-profile.png";


            if (userRole) {
                setProfile({
                    username: employeeUsername,
                    full_name: employeeFullName,
                    avatar_url: employeeAvatarUrl,
                    role: userRole,
                    employee_id: employeeData.id
                });

                if (userRole === 'hr_manager') {
                    setIsHRManager(true);
                } else {
                    toast.error('Access Denied: You do not have HR Manager privileges.');
                    router.replace('/login');
                }
            } else {
                console.error('Error: User role not found in user metadata for auth user:', authUser.id);
                toast.error('Failed to load user profile. Role not found in authentication data.');
                router.replace('/login');
            }
            
            setLoading(false);
        }

        checkUserAndRole();
    }, [supabase, router]);

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    const handleCloseMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleDesktopSidebarToggle = () => {
        setIsDesktopSidebarExpanded(prev => !prev);
    };

    if (loading) {
        return <Loading />;
    }

    if (!isHRManager) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <p className="text-lg text-red-600 font-bold">Access Denied: You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className='flex flex-nowrap h-screen'>
            <SideNavBar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
                isDesktopSidebarExpanded={isDesktopSidebarExpanded}
                toggleDesktopSidebar={handleDesktopSidebarToggle}
            />
            <div className="flex-1 flex flex-col overflow-x-auto">
                <TopNavBar
                    profile={profile}
                    onMobileMenuToggle={handleMobileMenuToggle}
                />
                <div className="py-4 px-7 flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}