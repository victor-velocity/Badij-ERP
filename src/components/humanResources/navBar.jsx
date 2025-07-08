import React from "react";

export default function NavBar() {
    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="text-xl font-bold text-gray-800">Human Resources</div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                        <a href="/employees" className="text-gray-600 hover:text-gray-900">Employees</a>
                        <a href="/reports" className="text-gray-600 hover:text-gray-900">Reports</a>
                    </div>
                </div>
            </div>
        </nav>
    );
}