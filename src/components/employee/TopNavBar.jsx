// components/employee/TopNav.jsx
'use client';

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSignOutAlt, faUserCircle, faBell, faCaretDown } from '@fortawesome/free-solid-svg-icons';
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

    if (!profile) {
        return (
            <nav className="bg-white w-full border-b border-gray-200 shadow-sm flex items-center justify-end px-4">
                <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse hidden md:block"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse hidden md:block"></div>
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
                        className="md:hidden p-2 rounded-md  focus:outline-none focus:ring-2 focus:ring-[#b88b1b] mr-4"
                        aria-label="Open mobile navigation"
                    >
                        <FontAwesomeIcon icon={faBars} className="text-gray-600 text-xl" />
                    </button>
                </div>

                <div className="relative flex items-center space-x-4" ref={dropdownRef}>
                    <button
                        onClick={toggleDropdown}
                        className="flex items-center space-x-2 p-2 rounded-md cursor-pointer"
                        aria-haspopup="true"
                        aria-expanded={isDropdownOpen}
                    >
                        {profile.avatar_url ? (
                            <div className="relative w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                                <Image
                                    src={profile.avatar_url}
                                    alt="User Avatar"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 36px"
                                />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                                {profile.username ? profile.username.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}
                        <div className="hidden md:flex flex-col text-left text-sm">
                            <span className="font-semibold text-gray-800">{profile.full_name || profile.username || 'Guest'}</span>
                            <span className="text-gray-600 capitalize">{profile.role?.replace('_', ' ') || 'User'}</span>
                        </div>
                        {/* Dropdown Indicator Icon */}
                        <FontAwesomeIcon
                            icon={faCaretDown}
                            className={`ml-1 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                            {/* <button
                                onClick={() => handleDropdownClick('/employee/notifications')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <FontAwesomeIcon icon={faBell} className="mr-2 text-gray-500" />
                                Notifications
                            </button> */}
                            <button
                                onClick={() => handleDropdownClick('/employee/my-profile')}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <FontAwesomeIcon icon={faUserCircle} className="mr-2 text-gray-500" />
                                My Profile
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={() => handleDropdownClick('logout')}
                                disabled={logoutLoading}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                                {logoutLoading ? (
                                    <svg className="animate-spin h-4 w-4 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
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