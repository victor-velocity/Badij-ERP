import React from 'react';

export function TopSellingProducts() {
    const products = [
        { name: 'Chair A', units: 100 },
        { name: 'Chair A', units: 100 },
        { name: 'Chair A', units: 100 },
        { name: 'Chair A', units: 100 },
        { name: 'Chair A', units: 100 },
    ];

    return (
        <div className="bg-white rounded-[20px] h-[400px] overflow-y-auto p-6 shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Top 5 Selling Products</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product name
                            </th>
                            <th scope="col" className="py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Units sold
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product, index) => (
                            <tr key={index}>
                                <td className="py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {product.name}
                                </td>
                                <td className="text-right py-4 whitespace-nowrap text-sm text-gray-500">
                                    {product.units}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}