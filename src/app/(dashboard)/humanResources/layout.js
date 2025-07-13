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
    const [isHRManager, setIsHRManager] = useState(true);
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
                toast.error('You must be logged in to access this page.');
                router.replace('/login');
                setLoading(false);
                return;
            }

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('username, full_name, avatar_url, role')
                .eq('id', authUser.id)
                .single();

            if (profileError) {
                console.error('Error fetching user profile:', profileError.message);
                toast.error('Failed to load user profile. Please try again.');
                router.replace('/login');
                setLoading(false);
                return;
            }

            if (profileData) {
                setProfile(profileData);
                if (profileData.role === 'hr_manager') {
                    setIsHRManager(true);
                } else {
                    toast.error('Access Denied: You do not have HR Manager privileges.');
                    router.replace('/dashboard');
                }
            } else {
                console.warn('No profile found for authenticated user:', authUser.id);
                setProfile({ username: 'Guest', full_name: 'Guest User', avatar_url: null, role: 'user' });
                toast.info('Please complete your profile information.');
                router.replace('/dashboard');
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
                <p className="text-lg text-red-600">Access Denied: You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className='flex flex-nowrap h-screen'>
            {/* NavBar component */}
            <SideNavBar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
                isDesktopSidebarExpanded={isDesktopSidebarExpanded}
                toggleDesktopSidebar={handleDesktopSidebarToggle}
            />
            <div className="flex-1 flex flex-col overflow-x-auto">
                <TopNavBar />
                <div className="py-4 px-7 flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
