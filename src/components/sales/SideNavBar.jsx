'use client';

import React, { useEffect } from "react";
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, 
  faTimes, 
  faThLarge, 
  faUsers, 
  faClipboardList, 
  faChartLine, 
  faMoneyBillAlt, 
  faFileAlt, 
  faCog, 
  faArrowRightFromBracket 
} from '@fortawesome/free-solid-svg-icons';
import { usePathname } from 'next/navigation';
import Image from "next/image";
import { createClient } from "@/app/lib/supabase/client";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SideNavBar({ isMobileMenuOpen, onCloseMobileMenu, isDesktopSidebarExpanded, toggleDesktopSidebar }) {
    const pathname = usePathname();
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (isMobileMenuOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'unset';
            }
        }
        return () => {
            if (typeof window !== 'undefined') {
                document.body.style.overflow = 'unset';
            }
        };
    }, [isMobileMenuOpen]);

    const navItems = [
        { name: "Dashboard", icon: faThLarge, path: "/sales" },
        { name: "Customers", icon: faUsers, path: "/sales/customers" },
        { name: "Orders", icon: faClipboardList, path: "/sales/orders" },
        { name: "Report", icon: faChartLine, path: "/sales/report" },
        { name: "Payroll", icon: faMoneyBillAlt, path: "/sales/payroll" },
        { name: "Documents", icon: faFileAlt, path: "/sales/documents" },
        { name: "Settings", icon: faCog, path: "/sales/settings" }
    ];

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            toast.error(error.message || 'Failed to log out.');
            console.error('Logout error:', error.message);
        } else {
            toast.success('Successfully logged out!');
            router.push('/');
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <nav
                className={`hidden md:flex flex-col h-screen bg-white shadow-sm transition-all duration-300 ease-in-out
                ${isDesktopSidebarExpanded ? 'w-64' : 'w-20'}`}
            >
                <div className={`flex items-center p-4 h-[79.4px] ${isDesktopSidebarExpanded ? 'justify-between' : 'justify-center'} shadow-sm`}>
                    {isDesktopSidebarExpanded && (
                        <Image src="/madisonjayng_logo.png" alt="madisonjay logo" width={150} height={20} />
                    )}
                    <button
                        onClick={toggleDesktopSidebar}
                        className="p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b88b1b] mt-"
                        aria-label={isDesktopSidebarExpanded ? "Collapse navigation" : "Expand navigation"}
                    >
                        <FontAwesomeIcon icon={faBars} className="text-gray-600 text-xl" />
                    </button>
                </div>

                {/* Scrollable area for desktop navigation items */}
                <div className="flex-grow mt-4 px-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link href={item.path} key={item.name} passHref>
                            <div
                                className={`flex items-center py-3 rounded-md mb-2 cursor-pointer
                                ${pathname === item.path
                                        ? 'bg-[#EBC75F] text-white'
                                        : 'text-gray-600 hover:bg-[#ffecc0] hover:text-[#b88b1b]'
                                    }
                                ${isDesktopSidebarExpanded ? 'px-4' : 'justify-center'}
                                `}
                            >
                                <FontAwesomeIcon icon={item.icon} className={`text-lg ${isDesktopSidebarExpanded ? 'mr-3' : ''}`} />
                                {isDesktopSidebarExpanded && (
                                    <span className="whitespace-nowrap overflow-hidden text-sm font-medium">
                                        {item.name}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Logout button at the bottom for desktop sidebar */}
                <div className={`mt-auto p-2 ${isDesktopSidebarExpanded ? 'px-4' : 'justify-center flex'}`}>
                    <button onClick={() => handleLogout()}>
                        <div className={`flex items-center py-3 rounded-md cursor-pointer
                            text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200
                            ${isDesktopSidebarExpanded ? 'px-4 w-full' : 'justify-center'}
                        `}>
                            <FontAwesomeIcon icon={faArrowRightFromBracket} className={`text-lg ${isDesktopSidebarExpanded ? 'mr-3' : ''}`} />
                            {isDesktopSidebarExpanded && (
                                <span className="whitespace-nowrap overflow-hidden text-sm font-medium">
                                    Logout
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-64 bg-gray-800 shadow-lg text-white md:hidden flex flex-col`}
            >
                <div className="p-4 flex justify-between items-center border-b border-gray-700">
                    <Image src="/madisonjayng_logo.png" alt="madisonjay logo" width={150} height={20} />
                    <button
                        onClick={onCloseMobileMenu}
                        className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Close navigation menu"
                    >
                        <FontAwesomeIcon icon={faTimes} className="text-white text-xl" />
                    </button>
                </div>

                {/* Scrollable area for mobile navigation items */}
                <div className="flex-grow flex flex-col p-4 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link href={item.path} key={item.name} passHref>
                            <div
                                onClick={onCloseMobileMenu}
                                className={`flex items-center py-3 px-2 rounded-md transition-colors duration-200 mb-2
                                ${pathname === item.path
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }
                                `}
                            >
                                <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
                                <span className="text-lg font-medium">{item.name}</span>
                            </div>
                        </Link>
                    ))}
                    <button onClick={() => handleLogout()} className="w-full">
                        <div className="flex items-center py-3 px-2 rounded-md text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors duration-200 mt-4">
                            <FontAwesomeIcon icon={faArrowRightFromBracket} className="mr-3 text-xl" />
                            <span className="text-lg font-medium">Logout</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Overlay for mobile menu */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onCloseMobileMenu}
                ></div>
            )}
        </>
    );
}