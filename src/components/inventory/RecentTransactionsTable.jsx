import React, { useState, useEffect } from 'react';
import { faEye, faFileInvoice, faCalendarAlt, faCheckCircle, faDollarSign, faSpinner, faBox, faTruck, faTruckLoading, faShoppingBag, faTimes, faUser, faMapMarkerAlt, faStickyNote } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function RecentTransactionsTable() {
    const [searchTerm, setSearchTerm] = useState('');
    const [originalTransactions, setOriginalTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const goldColor = '#b88b1b';
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await apiService.getOrders(router);
                if (response.status === "success") {
                    const sortedOrders = (response.data || []).sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    );
                    const formattedTransactions = sortedOrders.map(order => ({
                        invoice: order.order_number,
                        date: order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        }) : 'Not set',
                        items: order.order_details?.map(detail => ({
                            name: detail.product_id?.name || 'Unknown Product',
                            quantity: detail.quantity || 0,
                            price: detail.product_id?.price || 0,
                            total: (detail.product_id?.price || 0) * (detail.quantity || 0)
                        })) || [],
                        status: order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown',
                        price: `₦${order.total_amount?.toLocaleString() || '0.00'}`,
                        customerName: '', // Placeholder, fetch if needed
                        address: order.dispatch_address || 'Not specified',
                        deliveryDate: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set',
                        notes: order.notes || 'No notes',
                        originalData: order
                    }));
                    setOriginalTransactions(formattedTransactions);
                    setFilteredTransactions(formattedTransactions);
                    toast.success("Recent transactions fetched successfully!");
                } else {
                    setError(response.message || "Failed to fetch orders");
                    toast.error(response.message || "Failed to fetch orders");
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
                setError(error.message);
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    useEffect(() => {
        const results = originalTransactions.filter(transaction =>
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
    }, [searchTerm, originalTransactions]);

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
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'text-orange-500';
            case 'processing':
                return 'text-yellow-500';
            case 'ready for dispatch':
                return 'text-blue-500';
            case 'in transit':
                return 'text-purple-500';
            case 'shipped to customer':
                return 'text-green-500';
            case 'delivered':
                return 'text-green-500';
            case 'canceled':
                return 'text-red-500';
            case 'unpaid':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return faSpinner;
            case 'processing':
                return faBox;
            case 'ready for dispatch':
                return faTruckLoading;
            case 'in transit':
                return faTruck;
            case 'shipped to customer':
                return faCheckCircle;
            case 'delivered':
                return faCheckCircle;
            case 'canceled':
                return faTimes;
            case 'unpaid':
                return faDollarSign;
            default:
                return faSpinner;
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold flex-shrink-0">Recent Transactions</h2>
                <div className="flex w-full md:w-auto">
                    <div className="relative flex-grow mr-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#b88b1b]"
                            disabled={loading}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            Array.from({ length: itemsPerPage }).map((_, index) => (
                                <tr key={index} className="animate-pulse">
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                                </tr>
                            ))
                        ) : currentTransactions.length > 0 ? (
                            currentTransactions.map((transaction, index) => (
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
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                    {originalTransactions.length === 0 && !error ? "No transactions found" : "No transactions match your search"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            {!loading && totalPages > 1 && (
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
            )}

            {/* Modal for transaction details */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-100 space-y-4">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold flex items-center">
                                <FontAwesomeIcon icon={faFileInvoice} className="mr-2 text-[#b88b1b]" />
                                Transaction Details: {selectedTransaction.invoice}
                            </h3>
                            <button 
                                onClick={() => setSelectedTransaction(null)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <p className="flex items-center text-gray-700">
                                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500" />
                                <strong className='mr-2'>Date:</strong> {selectedTransaction.date}
                            </p>
                            <p className="flex items-center text-gray-700">
                                <FontAwesomeIcon icon={getStatusIcon(selectedTransaction.status)} className={`${getStatusStyles(selectedTransaction.status)} mr-2`} />
                                <strong className='mr-2'>Status:</strong> <span className={getStatusStyles(selectedTransaction.status)}>{selectedTransaction.status}</span>
                            </p>
                            <p className="flex items-center text-gray-700">
                                <FontAwesomeIcon icon={faDollarSign} className="mr-2 text-green-500" />
                                <strong className='mr-2'>Total Price:</strong> {selectedTransaction.price}
                            </p>
                        </div>
                        <h4 className="font-semibold text-lg mb-2 flex items-center">
                            <FontAwesomeIcon icon={faShoppingBag} className="mr-2 text-purple-500" />
                            Items Purchased:
                        </h4>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2 text-left font-medium text-gray-600">Product Name</th>
                                        <th className="p-2 text-right font-medium text-gray-600">Quantity</th>
                                        <th className="p-2 text-right font-medium text-gray-600">Price</th>
                                        <th className="p-2 text-right font-medium text-gray-600">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedTransaction.items.map((item, idx) => (
                                        <tr key={idx} className="border-b">
                                            <td className="p-2 text-gray-700">{item.name}</td>
                                            <td className="p-2 text-right text-gray-700">{item.quantity}</td>
                                            <td className="p-2 text-right text-gray-700">₦{item.price.toLocaleString()}</td>
                                            <td className="p-2 text-right text-gray-700 font-medium">₦{item.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={() => setSelectedTransaction(null)}
                            className="mt-4 px-4 py-2 bg-[#b88b1b] text-white rounded hover:bg-[#755912] transition-colors w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}