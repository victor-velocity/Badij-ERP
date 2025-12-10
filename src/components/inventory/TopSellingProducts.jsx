import React, { useState, useEffect } from 'react';

export function TopSellingProducts() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDaysInMonth = (month, year) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month, year) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const rows = [];
        let cells = [];
        const today = new Date();
        const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();

        // Empty cells for days before the first
        for (let i = 0; i < firstDay; i++) {
            cells.push(<td key={`empty-${i}`} className="py-2 px-4"></td>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = isCurrentMonth && day === today.getDate();
            cells.push(
                <td
                    key={day}
                    className={`py-2 px-4 text-center ${isToday ? 'bg-[#153087] text-white rounded-full' : ''}`}
                >
                    {day}
                </td>
            );

            if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                rows.push(<tr key={day}>{cells}</tr>);
                cells = [];
            }
        }

        return rows;
    };

    return (
        <div className="bg-white rounded-[20px] h-[400px] overflow-y-auto p-6 shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="text-gray-500 hover:text-gray-700">&lt;</button>
                <h2 className="text-xl font-bold">
                    {months[currentMonth]} {currentYear}
                </h2>
                <button onClick={handleNextMonth} className="text-gray-500 hover:text-gray-700">&gt;</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sun</th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mon</th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tue</th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wed</th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thu</th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fri</th>
                            <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {renderCalendar()}
                    </tbody>
                </table>
            </div>
        </div>
    );
}