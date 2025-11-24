'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import TopNavBar from '@/components/employee/TopNavBar';
import Loading from '@/components/Loading';
import SideNavBar from '@/components/employee/SideNavBar';

export default function UserLayout({ children }) {
    const supabase = createClient();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isUser, setIsUser] = useState(false);
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
                localStorage.removeItem('user_id');
                return;
            }

            localStorage.setItem('user_id', authUser.id);

            const { data: employeeData, error: employeeError } = await supabase
                .from('employees')
                .select('id, first_name, last_name, email, user_id, avatar_url, department_id, leave_balance')
                .eq('user_id', authUser.id)
                .single();

            if (employeeError || !employeeData) {
                console.error('Error fetching employee:', employeeError?.message);
                toast.error('Failed to load employee profile.');
                router.replace('/login');
                setLoading(false);
                return;
            }

            let departmentName = 'Employee';
            let isSalesEmployee = false;

            if (employeeData.department_id) {
                const { data: deptData, error: deptError } = await supabase
                    .from('departments')
                    .select('name')
                    .eq('id', employeeData.department_id)
                    .single();

                if (!deptError && deptData) {
                    departmentName = deptData.name;
                    isSalesEmployee = deptData.name.toLowerCase() === 'sales';
                } else {
                    console.warn('Could not fetch department:', deptError?.message);
                }
            }

            const userRole = authUser.app_metadata?.role;
            const employeeFullName = `${employeeData.first_name} ${employeeData.last_name}`;
            const employeeUsername = employeeData.email.split('@')[0];
            const employeeAvatarUrl = employeeData.avatar_url || "/default-profile.png";
            const employeeLeaveBalance = employeeData.leave_balance

            localStorage.setItem('first_name', employeeData.first_name);

            if (userRole) {
                setProfile({
                    username: employeeUsername,
                    full_name: employeeFullName,
                    avatar_url: employeeAvatarUrl,
                    role: departmentName,
                    employee_id: employeeData.id,
                    isSalesEmployee,
                    leave_balance: employeeLeaveBalance,
                });

                if (userRole === 'user') {
                    setIsUser(true);
                } else {
                    toast.error('Access Denied: You do not have employee privileges.');
                    router.replace('/login');
                }
            } else {
                toast.error('Role not found in user metadata.');
                router.replace('/login');
            }

            setLoading(false);
        }

        checkUserAndRole();
    }, [supabase, router]);

    const handleMobileMenuToggle = () => setIsMobileMenuOpen(prev => !prev);
    const handleCloseMobileMenu = () => setIsMobileMenuOpen(false);
    const handleDesktopSidebarToggle = () => setIsDesktopSidebarExpanded(prev => !prev);

    if (loading) return <Loading />;
    if (!isUser) return null;

    return (
        <div className='flex flex-nowrap h-screen'>
            <SideNavBar
                isMobileMenuOpen={isMobileMenuOpen}
                onCloseMobileMenu={handleCloseMobileMenu}
                isDesktopSidebarExpanded={isDesktopSidebarExpanded}
                toggleDesktopSidebar={handleDesktopSidebarToggle}
                isSalesEmployee={profile?.isSalesEmployee}
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
            <div id="modal-root"></div>
        </div>
    );
}