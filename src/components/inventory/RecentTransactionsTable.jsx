import React, { useState, useEffect } from 'react';

const initialTransactions = [
    { invoice: '#AB1301', date: '12/08/2025', item: 'Chair A', quantity: 100, status: 'Delivered', price: '₦300,000' },
    { invoice: '#AB1302', date: '12/08/2025', item: 'Chair B', quantity: 50, status: 'In progress', price: '₦150,000' },
    { invoice: '#AB1303', date: '12/08/2025', item: 'Table A', quantity: 25, status: 'Delivered', price: '₦200,000' },
    { invoice: '#AB1304', date: '12/08/2025', item: 'Table B', quantity: 30, status: 'In progress', price: '₦250,000' },
    { invoice: '#AB1305', date: '12/08/2025', item: 'Sofa A', quantity: 10, status: 'Delivered', price: '₦500,000' },
    { invoice: '#AB1306', date: '12/08/2025', item: 'Sofa B', quantity: 15, status: 'Failed', price: '₦600,000' },
    { invoice: '#AB1307', date: '13/08/2025', item: 'Chair C', quantity: 75, status: 'Delivered', price: '₦225,000' },
    { invoice: '#AB1308', date: '13/08/2025', item: 'Table C', quantity: 20, status: 'In progress', price: '₦180,000' },
    { invoice: '#AB1309', date: '13/08/2025', item: 'Sofa C', quantity: 12, status: 'Delivered', price: '₦480,000' },
    { invoice: '#AB1310', date: '14/08/2025', item: 'Chair D', quantity: 60, status: 'Failed', price: '₦180,000' },
    { invoice: '#AB1311', date: '14/08/2025', item: 'Table D', quantity: 18, status: 'Delivered', price: '₦162,000' },
    { invoice: '#AB1312', date: '14/08/2025', item: 'Sofa D', quantity: 8, status: 'In progress', price: '₦320,000' },
];

export function RecentTransactionsTable() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTransactions, setFilteredTransactions] = useState(initialTransactions);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const goldColor = '#b88b1b';

    useEffect(() => {
        const results = initialTransactions.filter(transaction =>
            Object.values(transaction).some(value =>
                value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredTransactions(results);
        setCurrentPage(1); // Reset to first page when search changes
    }, [searchTerm]);

    // Get current transactions
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
    
    // Calculate total pages
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    
    // Generate page numbers to show
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 7;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            // Always show first page
            pageNumbers.push(1);
            
            // Calculate start and end of visible page range
            let startPage = Math.max(2, currentPage - 2);
            let endPage = Math.min(totalPages - 1, currentPage + 2);
            
            // Adjust if we're near the beginning
            if (currentPage <= 3) {
                endPage = 5;
            }
            
            // Adjust if we're near the end
            if (currentPage >= totalPages - 2) {
                startPage = totalPages - 4;
            }
            
            // Add ellipsis after first page if needed
            if (startPage > 2) {
                pageNumbers.push('...');
            }
            
            // Add middle pages
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
            
            // Add ellipsis before last page if needed
            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }
            
            // Always show last page
            pageNumbers.push(totalPages);
        }
        
        return pageNumbers;
    };

    const changePage = (page) => {
        if (page === '...') return;
        setCurrentPage(page);
    };

    const goToPreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Delivered':
                return 'text-green-500';
            case 'In progress':
                return 'text-yellow-500';
            case 'Failed':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold flex-shrink-0">Recent transaction</h2>
                <div className="flex w-full md:w-auto">
                    <div className="relative flex-grow mr-4 ">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                    <button
                        className="px-6 py-2 rounded-sm text-white font-medium"
                        style={{ backgroundColor: goldColor }}
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentTransactions.map((transaction, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.invoice}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.item}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.quantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={getStatusStyles(transaction.status)}>
                                        {transaction.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center items-center gap-4">
                <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center p-2 rounded-md border border-gray-300 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: currentPage !== 1 ? goldColor : '#e5e7eb' }}
                >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
                
                <div className="flex gap-2 text-sm font-medium">
                    {getPageNumbers().map((pageNumber, index) => (
                        <span
                            key={index}
                            onClick={() => changePage(pageNumber)}
                            className={`px-3 py-1 rounded-md border border-gray-300 cursor-pointer ${pageNumber === currentPage ? 'text-white' : ''}`}
                            style={pageNumber === currentPage ? { backgroundColor: goldColor, color: 'white' } : {}}
                        >
                            {pageNumber}
                        </span>
                    ))}
                </div>
                
                <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center p-2 rounded-md border border-gray-300 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: currentPage !== totalPages ? goldColor : '#e5e7eb' }}
                >
                    <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l-3.293-3.293a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}