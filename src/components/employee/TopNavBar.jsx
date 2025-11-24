// components/employee/TopNav.jsx
'use client';

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars,
    faSignOutAlt,
    faUserCircle,
    faBell,
    faCaretDown,
    faStar
} from '@fortawesome/free-solid-svg-icons';
import Image from "next/image";
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function TopNavBar({ onMobileMenuToggle, profile }) {
    const supabase = createClient();
    const router = useRouter();

    const [logoutLoading, setLogoutLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        setLogoutLoading(true);
        const { error } = await supabase.auth.signOut();

        if (error) {
            toast.error(error.message || 'Failed to log out.');
            console.error('Logout error:', error.message);
        } else {
            toast.success('Successfully logged out!');
            router.push('/');
        }
        setLogoutLoading(false);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const handleDropdownClick = (path) => {
        setIsDropdownOpen(false);
        if (path === 'logout') {
            handleLogout();
        } else {
            router.push(path);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Determine leave balance color
    const getLeaveBalanceColor = (balance) => {
        if (balance === undefined || balance === null) return "bg-gray-400";
        if (balance >= 15) return "bg-green-500";
        if (balance >= 8) return "bg-yellow-500";
        if (balance >= 4) return "bg-orange-500";
        return "bg-red-500";
    };

    const leaveBalance = profile?.leave_balance ?? null;
    const maxLeave = 21;

    if (!profile) {
        return (
            <nav className="bg-white w-full border-b border-gray-200 shadow-sm flex items-center justify-end px-4">
                <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse hidden md:block"></div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-white w-full h-20 border-b border-gray-200 shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                <div className="flex items-center">
                    <button
                        onClick={onMobileMenuToggle}
                        className="md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b] mr-4"
                        aria-label="Open mobile navigation"
                    >
                        <FontAwesomeIcon icon={faBars} className="text-gray-600 text-xl" />
                    </button>
                </div>

                <div className="relative flex items-center space-x-4" ref={dropdownRef}>
                    <button
                        onClick={toggleDropdown}
                        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                    >
                        {leaveBalance !== null && (
                            <div className="p-1">
                                <div className={`relative w-8 h-8 rounded-full ${getLeaveBalanceColor(leaveBalance)} flex items-center justify-center text-white font-bold text-xs shadow-md transition-all group-hover:scale-110`}>
                                    <span className="relative z-10">
                                        {leaveBalance}
                                    </span>
                                </div>
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {leaveBalance}/{maxLeave} days left
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-gray-800"></div>
                                </div>
                            </div>
                        )}

                        {/* Avatar */}
                        <div className="relative">
                            {profile.avatar_url ? (
                                <div className="relative w-11 h-11 rounded-full overflow-hidden ring-4 ring-white shadow-md">
                                    <Image
                                        src={profile.avatar_url}
                                        alt="User Avatar"
                                        fill
                                        className="object-cover"
                                        sizes="44px"
                                    />
                                </div>
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#b88b1b] to-[#d4a53b] flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {profile.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                            )}
                        </div>

                        {/* Name & Role */}
                        <div className="hidden md:flex flex-col text-left">
                            <span className="font-bold text-gray-800 text-sm">
                                {profile.full_name || profile.username || 'Guest'}
                            </span>
                            <span className="text-xs text-gray-600 capitalize">
                                {profile.role?.replace('_', ' ') || 'Employee'}
                            </span>
                        </div>

                        {/* Dropdown Arrow */}
                        <FontAwesomeIcon
                            icon={faCaretDown}
                            className={`text-gray-500 text-sm transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-3 z-50 overflow-hidden">
                            <button
                                onClick={() => handleDropdownClick('/employee/my-profile')}
                                className="flex items-center w-full px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                            >
                                <FontAwesomeIcon icon={faUserCircle} className="mr-3 text-gray-500" />
                                My Profile
                            </button>
                            <div className="border-t border-gray-100 my-1 mx-4"></div>
                            <button
                                onClick={() => handleDropdownClick('logout')}
                                disabled={logoutLoading}
                                className="flex items-center w-full px-5 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                                {logoutLoading ? (
                                    <svg className="animate-spin h-4 w-4 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-3" />
                                )}
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}