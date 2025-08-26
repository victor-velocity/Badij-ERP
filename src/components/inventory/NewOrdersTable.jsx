import React from 'react';

export function NewOrdersTable() {
    const orders = [
        { invoice: '#AB1301', date: '12/08/2025' },
        { invoice: '#AB1301', date: '12/08/2025' },
        { invoice: '#AB1301', date: '12/08/2025' },
        { invoice: '#AB1301', date: '12/08/2025' },
        { invoice: '#AB1301', date: '12/08/2025' },
    ];

    return (
        <div className="bg-white rounded-[20px] h-[400px] overflow-y-auto p-6 shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">New orders</h2>
                <span className="text-sm text-gray-500 cursor-pointer hover:underline transition-all hover:text-gray-700">See all</span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice number
                            </th>
                            <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th scope="col" className="relative px-2 py-3">
                                <span className="sr-only">Process</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order, index) => (
                            <tr key={index}>
                                <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {order.invoice}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.date}
                                </td>
                                <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        className="px-4 py-2 rounded-md text-white font-medium transition-colors hover:bg-[#685c3e] bg-[#b88b1b]"
                                    >
                                        Process
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
