import React, { useState, useEffect } from 'react';
import { faEye, faFileInvoice, faCalendarAlt, faCheckCircle, faDollarSign, faSpinner, faBox, faTruck, faTruckLoading, faShoppingBag, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const initialTransactions = [
    { invoice: '#AB1301', date: '12/08/2025', items: [{ name: 'Chair A', quantity: 100 }], status: 'Shipped to customer', price: '₦300,000' },
    { invoice: '#AB1302', date: '12/08/2025', items: [{ name: 'Chair B', quantity: 50 }], status: 'Pending', price: '₦150,000' },
    { invoice: '#AB1303', date: '12/08/2025', items: [{ name: 'Table A', quantity: 25 }, { name: 'Chair C', quantity: 10 }, { name: 'Sofa A', quantity: 5 }], status: 'In transit', price: '₦200,000' },
    { invoice: '#AB1304', date: '12/08/2025', items: [{ name: 'Table B', quantity: 30 }], status: 'Inventory arrangement', price: '₦250,000' },
    { invoice: '#AB1305', date: '12/08/2025', items: [{ name: 'Sofa A', quantity: 10 }], status: 'Shipped to customer', price: '₦500,000' },
    { invoice: '#AB1306', date: '12/08/2025', items: [{ name: 'Sofa B', quantity: 15 }, { name: 'Table C', quantity: 8 }], status: 'Pending', price: '₦600,000' },
    { invoice: '#AB1307', date: '13/08/2025', items: [{ name: 'Chair C', quantity: 75 }], status: 'Ready for dispatch', price: '₦225,000' },
    { invoice: '#AB1308', date: '13/08/2025', items: [{ name: 'Table C', quantity: 20 }], status: 'Inventory arrangement', price: '₦180,000' },
    { invoice: '#AB1309', date: '13/08/2025', items: [{ name: 'Sofa C', quantity: 12 }, { name: 'Chair D', quantity: 15 }, { name: 'Table D', quantity: 7 }], status: 'Shipped to customer', price: '₦480,000' },
    { invoice: '#AB1310', date: '14/08/2025', items: [{ name: 'Chair D', quantity: 60 }], status: 'Pending', price: '₦180,000' },
    { invoice: '#AB1311', date: '14/08/2025', items: [{ name: 'Table D', quantity: 18 }], status: 'In transit', price: '₦162,000' },
    { invoice: '#AB1312', date: '14/08/2025', items: [{ name: 'Sofa D', quantity: 8 }], status: 'Ready for dispatch', price: '₦320,000' },
];

export function RecentTransactionsTable() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTransactions, setFilteredTransactions] = useState(initialTransactions);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const goldColor = '#b88b1b';

    useEffect(() => {
        const results = initialTransactions.filter(transaction =>
            [
                transaction.invoice,
                transaction.date,
                transaction.status,
                transaction.price,
                ...transaction.items.map(item => item.name),
                ...transaction.items.map(item => item.quantity.toString())
            ].some(value =>
                value.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredTransactions(results);
        setCurrentPage(1);
    }, [searchTerm]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 7;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            pageNumbers.push(1);

            let startPage = Math.max(2, currentPage - 2);
            let endPage = Math.min(totalPages - 1, currentPage + 2);

            if (currentPage <= 3) {
                endPage = 5;
            }

            if (currentPage >= totalPages - 2) {
                startPage = totalPages - 4;
            }

            if (startPage > 2) {
                pageNumbers.push('...');
            }

            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }

            if (endPage < totalPages - 1) {
                pageNumbers.push('...');
            }

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
            case 'Pending':
                return 'text-orange-500';
            case 'Inventory arrangement':
                return 'text-yellow-500';
            case 'Ready for dispatch':
                return 'text-blue-500';
            case 'In transit':
                return 'text-purple-500';
            case 'Shipped to customer':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Pending':
                return faSpinner;
            case 'Inventory arrangement':
                return faBox;
            case 'Ready for dispatch':
                return faTruckLoading;
            case 'In transit':
                return faTruck;
            case 'Shipped to customer':
                return faCheckCircle;
            default:
                return faSpinner;
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
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#b88b1b]"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentTransactions.map((transaction, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.invoice}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {transaction.items.length === 1
                                        ? transaction.items[0].name
                                        : `${transaction.items[0].name} +${transaction.items.length - 1}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={getStatusStyles(transaction.status)}>
                                        {transaction.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.price}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <FontAwesomeIcon
                                        icon={faEye}
                                        className="cursor-pointer transition-all ml-4 text-[#b88b1b] hover:text-[#533f0c]"
                                        onClick={() => setSelectedTransaction(transaction)}
                                    />
                                </td>
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

            {/* Modal for transaction details */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100 space-y-4">
                        <h3 className="text-xl font-bold mb-4 flex items-center">
                            <FontAwesomeIcon icon={faFileInvoice} className="mr-2 text-[#b88b1b]" />
                            Transaction Details: {selectedTransaction.invoice}
                        </h3>
                        <p className="flex items-center mb-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500" />
                            <strong className='mr-2'>Date:</strong> {selectedTransaction.date}
                        </p>
                        <p className="flex items-center mb-2">
                            <FontAwesomeIcon icon={getStatusIcon(selectedTransaction.status)} className={`${getStatusStyles(selectedTransaction.status)} mr-2`} />
                            <strong className='mr-2'>Status:</strong> <span className={getStatusStyles(selectedTransaction.status)}>{selectedTransaction.status}</span>
                        </p>
                        <p className="flex items-center mb-2">
                            <FontAwesomeIcon icon={faDollarSign} className="mr-2 text-green-500" />
                            <strong className='mr-2'>Total Price:</strong> {selectedTransaction.price}
                        </p>
                        <h4 className="font-semibold mt-4 mb-2 flex items-center">
                            <FontAwesomeIcon icon={faShoppingBag} className="mr-2 text-purple-500" />
                            Items Purchased:
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                            {selectedTransaction.items.map((item, idx) => (
                                <li key={idx} className="text-gray-700">{item.name} - Quantity: {item.quantity}</li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setSelectedTransaction(null)}
                            className="mt-4 px-4 py-2 bg-[#b88b1b] text-white rounded hover:bg-[#755912] flex items-center justify-center float-right transition-colors duration-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}