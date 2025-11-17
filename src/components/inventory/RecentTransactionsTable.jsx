import React, { useState, useEffect } from 'react';
import { faEye, faCalendarAlt, faBox, faTruck, faTruckLoading, faCheckCircle, faTimes, faSpinner, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function RecentTransactionsTable() {
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const itemsPerPage = 4; // 4 orders per page
    const router = useRouter();
    const goldColor = '#b88b1b';

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await apiService.getOrders(router);
                
                if (response.status === "success") {
                    const recentOrders = (response.data || [])
                        .filter(order => order.status !== 'unpaid')
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 7); // Only 7 most recent

                    const formatted = recentOrders.map(order => ({
                        invoice: order.order_number,
                        date: order.created_at 
                            ? new Date(order.created_at).toLocaleDateString('en-GB', { 
                                day: '2-digit', month: 'short', year: 'numeric' 
                              })
                            : 'N/A',
                        items: order.order_details?.map(d => ({
                            name: d.product_id?.name || 'Unknown Item',
                            quantity: d.quantity || 0
                        })) || [],
                        totalItems: order.order_details?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0,
                        status: order.status?.charAt(0).toUpperCase() + order.status?.slice(1),
                        deliveryDate: order.delivery_date 
                            ? new Date(order.delivery_date).toLocaleDateString('en-GB', { 
                                day: '2-digit', month: 'short' 
                              })
                            : 'Not set',
                        address: order.dispatch_address || 'No address',
                        notes: order.notes || '',
                        originalData: order
                    }));

                    setTransactions(formatted);
                    setFilteredTransactions(formatted);
                    toast.success("Recent orders loaded");
                } else {
                    toast.error("Failed to load orders");
                }
            } catch (err) {
                console.error(err);
                toast.error("Error loading orders");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    // Search filter
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredTransactions(transactions);
            setCurrentPage(1);
            return;
        }

        const filtered = transactions.filter(t =>
            t.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredTransactions(filtered);
        setCurrentPage(1);
    }, [searchTerm, transactions]);

    // Pagination logic
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredTransactions.slice(startIndex, endIndex);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'processing': return faBox;
            case 'ready for dispatch': return faTruckLoading;
            case 'in transit': 
            case 'shipped': return faTruck;
            case 'delivered': return faCheckCircle;
            case 'canceled': return faTimes;
            default: return faSpinner;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'processing': return 'text-yellow-600 bg-yellow-50';
            case 'ready for dispatch': return 'text-blue-600 bg-blue-50';
            case 'in transit': 
            case 'shipped': return 'text-purple-600 bg-purple-50';
            case 'delivered': return 'text-green-600 bg-green-50';
            case 'canceled': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-2xl font-bold text-gray-800">Recent Orders</h3>
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search invoice or product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-transparent transition"
                        />
                        <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-6"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    <td className="px-6 py-6"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="px-6 py-6"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                    <td className="px-6 py-6"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                                    <td className="px-6 py-6"><div className="h-8 bg-gray-200 rounded-full w-24"></div></td>
                                    <td className="px-6 py-6"><div className="h-8 bg-gray-200 rounded w-8"></div></td>
                                </tr>
                            ))
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-16 text-center text-gray-500 text-lg">
                                    {transactions.length === 0 ? "No recent orders" : "No orders match your search"}
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((t, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-5 text-sm font-medium text-gray-900">{t.invoice}</td>
                                    <td className="px-6 py-5 text-sm text-gray-600">{t.date}</td>
                                    <td className="px-6 py-5 text-sm text-gray-700">
                                        {t.items.length === 1 
                                            ? t.items[0].name 
                                            : `${t.items[0].name} +${t.items.length - 1} more`
                                        }
                                    </td>
                                    <td className="px-6 py-5 text-sm font-medium text-gray-900">{t.totalItems}</td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}>
                                            <FontAwesomeIcon icon={getStatusIcon(t.status)} className="w-3.5 h-3.5" />
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button
                                            onClick={() => setSelectedTransaction(t)}
                                            className="text-[#b88b1b] hover:text-[#9a7516] transition-colors"
                                            title="View Details"
                                        >
                                            <FontAwesomeIcon icon={faEye} className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && !loading && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="text-sm text-gray-600">
                        Showing {startIndex + 1}–{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} orders
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                        </button>

                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToPage(i + 1)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                        currentPage === i + 1
                                            ? 'bg-[#b88b1b] text-white'
                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        >
                            <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">
                                    Order: {selectedTransaction.invoice}
                                </h3>
                                <button
                                    onClick={() => setSelectedTransaction(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6 text-sm">
                                <div>
                                    <span className="font-medium text-gray-600">Order Date</span>
                                    <p className="mt-1 text-lg text-gray-900">{selectedTransaction.date}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-600">Expected Delivery</span>
                                    <p className="mt-1 text-lg text-gray-900">{selectedTransaction.deliveryDate}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedTransaction.status)}`}>
                                    <FontAwesomeIcon icon={getStatusIcon(selectedTransaction.status)} />
                                    {selectedTransaction.status}
                                </span>
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-800 mb-3 text-lg">Items ({selectedTransaction.totalItems})</h4>
                                <div className="space-y-3">
                                    {selectedTransaction.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50 px-5 py-4 rounded-xl">
                                            <span className="font-medium text-gray-800">{item.name}</span>
                                            <span className="text-lg font-bold text-[#b88b1b]">×{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedTransaction.address && selectedTransaction.address !== 'No address' && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Delivery Address</h4>
                                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
                                        {selectedTransaction.address}
                                    </p>
                                </div>
                            )}

                            {selectedTransaction.notes && selectedTransaction.notes.trim() && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Customer Notes</h4>
                                    <p className="text-gray-700 italic text-sm bg-amber-50 p-4 rounded-lg">
                                        "{selectedTransaction.notes}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="w-full py-3 bg-[#b88b1b] text-white font-semibold rounded-lg hover:bg-[#9a7516] transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}