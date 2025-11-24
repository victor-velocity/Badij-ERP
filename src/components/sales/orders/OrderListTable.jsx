// src/components/sales/orders/OrderListTable.jsx
import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faEye, faEdit, faRefresh, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import CreateOrderModal from "./CreateOrderModal";
import EditOrderModal from "./EditOrderModal";
import ViewOrderModal from "./ViewOrderModal";
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

// Reusable Sorting Hook
const useSortableData = (items, config = { key: 'created_at', direction: 'desc' }) => {
    const [sortConfig, setSortConfig] = useState(config);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];

        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle dates from originalData
                if (sortConfig.key === 'created_at') {
                    aValue = new Date(a.originalData?.created_at || 0);
                    bValue = new Date(b.originalData?.created_at || 0);
                }
                if (sortConfig.key === 'deliveryDate') {
                    aValue = new Date(a.originalData?.delivery_date || 0);
                    bValue = new Date(b.originalData?.delivery_date || 0);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FontAwesomeIcon icon={faSort} className="ml-1 opacity-30" />;
        return sortConfig.direction === 'asc'
            ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-blue-600" />
            : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-blue-600" />;
    };

    return { items: sortedItems, requestSort, getSortIcon };
};

const OrderListTable = ({ initialOrders = [], onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orders, setOrders] = useState(initialOrders);
    const [loading, setLoading] = useState(initialOrders.length === 0);
    const [error, setError] = useState("");
    const [customers, setCustomers] = useState({});
    const [employees, setEmployees] = useState({});
    const itemsPerPage = 12;
    const router = useRouter();

    const skeletonRows = Array.from({ length: 8 }, (_, i) => i);

    // Format orders
    const formattedOrders = useMemo(() => {
        return orders.map(order => {
            const customer = customers[order.customer_id] || { name: 'Unknown Customer', phone: order.phone_number };
            const employee = employees[order.created_by] || { name: 'Unknown Employee' };

            return {
                id: order.order_id,
                order_number: order.order_number,
                customer: customer.name,
                address: order.dispatch_address || 'Not specified',
                deliveryDate: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB') : 'Not set',
                delivery_status: order.delivery_status || 'pending',
                payment_status: order.payment_status || 'unpaid',
                phone: customer.phone || order.phone_number,
                amount: order.total_amount || 0,
                created_by: employee.name,
                created_at: order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : 'Not set',
                originalData: order
            };
        });
    }, [orders, customers, employees]);

    // Apply sorting
    const { items: sortedOrders, requestSort, getSortIcon } = useSortableData(
        formattedOrders,
        { key: 'created_at', direction: 'desc' }
    );

    // Apply search
    const processedOrders = useMemo(() => {
        return sortedOrders.filter(order =>
            [order.order_number, order.customer, order.address, order.deliveryDate, order.created_by, order.delivery_status, order.payment_status]
                .some(field => field?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [sortedOrders, searchTerm]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = processedOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(processedOrders.length / itemsPerPage);

    const paginate = (page) => setCurrentPage(page);

    // Fetch helpers
    const fetchCustomerDetails = async (customerId) => {
        if (!customerId) return { name: 'Unknown Customer', phone: '' };
        try {
            const res = await apiService.getCustomerById(customerId, router);
            const data = res.data || res;
            return { name: data.name || 'Unknown Customer', phone: data.phone_number || '' };
        } catch (err) {
            return { name: 'Unknown Customer', phone: '' };
        }
    };

    const fetchEmployeeDetails = async (employeeId) => {
        if (!employeeId) return { name: 'Unknown Employee' };
        try {
            const res = await apiService.getEmployeeById(employeeId, router);
            const data = res.data || res;
            return { name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown Employee' };
        } catch (err) {
            return { name: 'Unknown Employee' };
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await apiService.getOrders(router);

            if (response.status === "success") {
                const ordersData = response.data || [];
                setOrders(ordersData);

                const customerIds = [...new Set(ordersData.map(o => o.customer_id).filter(Boolean))];
                const employeeIds = [...new Set(ordersData.map(o => o.created_by).filter(Boolean))];

                const customerResults = await Promise.all(customerIds.map(id => fetchCustomerDetails(id)));
                const customersMap = Object.fromEntries(customerIds.map((id, i) => [id, customerResults[i]]));
                setCustomers(customersMap);

                const employeeResults = await Promise.all(employeeIds.map(id => fetchEmployeeDetails(id)));
                const employeesMap = Object.fromEntries(employeeIds.map((id, i) => [id, employeeResults[i]]));
                setEmployees(employeesMap);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to load orders");
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
            onRefresh?.();
        }
    };

    useEffect(() => {
        if (initialOrders.length > 0) {
            setOrders(initialOrders);
            setLoading(false);
        } else {
            fetchOrders();
        }
    }, [initialOrders]);

    // Status badges
    const getDeliveryStatusBadge = (status) => {
        const s = (status || '').toLowerCase();
        const map = {
            pending: "bg-orange-100 text-orange-700 border border-orange-300",
            processing: "bg-yellow-100 text-yellow-700 border border-yellow-300",
            shipped: "bg-blue-100 text-blue-700 border border-blue-300",
            delivered: "bg-green-100 text-green-700 border border-green-300",
            canceled: "bg-red-100 text-red-700 border border-red-300",
        };
        return map[s] || "bg-gray-100 text-gray-700 border border-gray-300";
    };

    const getPaymentStatusBadge = (status) => {
        return status === "paid"
            ? "bg-green-100 text-green-700 border border-green-300"
            : "bg-red-100 text-red-700 border border-red-300";
    };

    const canEditOrder = (order) => {
        const o = order.originalData || order;
        return (o.delivery_status || 'pending') === 'pending' && (o.payment_status || 'unpaid') === 'unpaid';
    };

    const openEditModal = (id) => { setSelectedOrderId(id); setIsEditModalOpen(true); };
    const openViewModal = (id) => { setSelectedOrderId(id); setIsViewModalOpen(true); };

    const handleOrderSubmit = async (data) => {
        try {
            const res = await apiService.createOrder(data, router);
            if (res.status === "success") {
                await fetchOrders();
                setIsCreateModalOpen(false);
                toast.success("Order created successfully!");
            } else {
                toast.error(res.message || "Failed to create order");
            }
        } catch (err) {
            toast.error("Error creating order");
        }
    };

    const handleEditOrder = async (data) => {
        try {
            const res = await apiService.updateOrder(selectedOrderId, data, router);
            if (res.status === "success") {
                await fetchOrders();
                setIsEditModalOpen(false);
                setSelectedOrderId(null);
                toast.success("Order updated successfully!");
            } else {
                toast.error(res.message || "Failed to update order");
            }
        } catch (err) {
            toast.error("Error updating order");
        }
    };

    return (
        <div className="py-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-600 outline-none w-64"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            disabled={loading}
                        />
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2">
                        <FontAwesomeIcon icon={faPlus} /> Create Order
                    </button>
                    <button onClick={fetchOrders} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                        <FontAwesomeIcon icon={faRefresh} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg">{error}</div>}

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th onClick={() => requestSort('order_number')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                                Order No. {getSortIcon('order_number')}
                            </th>
                            <th onClick={() => requestSort('customer')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                                Customer {getSortIcon('customer')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                            <th onClick={() => requestSort('deliveryDate')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                                Delivery Date {getSortIcon('deliveryDate')}
                            </th>
                            <th onClick={() => requestSort('created_by')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                                Created By {getSortIcon('created_by')}
                            </th>
                            <th onClick={() => requestSort('created_at')} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100">
                                Created At {getSortIcon('created_at')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            skeletonRows.map(i => (
                                <tr key={i}>
                                    {[...Array(9)].map((_, j) => (
                                        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                                    ))}
                                </tr>
                            ))
                        ) : currentOrders.length > 0 ? (
                            currentOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900 font-mono text-sm">{order.order_number}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{order.customer}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={order.address}>{order.address}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{order.deliveryDate}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{order.created_by}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{order.created_at}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getDeliveryStatusBadge(order.delivery_status)}`}>
                                            {order.delivery_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(order.payment_status)}`}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => openViewModal(order.id)} className="text-blue-600 hover:text-blue-800" title="View">
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                            {canEditOrder(order) ? (
                                                <button onClick={() => openEditModal(order.id)} className="text-green-600 hover:text-green-800" title="Edit">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 cursor-not-allowed">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-6 py-16 text-center text-gray-500">
                                    {searchTerm ? "No orders match your search" : "No orders found"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center px-4">
                    <div className="text-sm text-gray-600">
                        Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, processedOrders.length)} of {processedOrders.length}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50">Previous</button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const page = currentPage <= 3 ? i + 1 : currentPage > totalPages - 3 ? totalPages - 4 + i : currentPage - 2 + i;
                            if (page < 1 || page > totalPages) return null;
                            return (
                                <button key={page} onClick={() => paginate(page)}
                                    className={`px-4 py-2 rounded ${currentPage === page ? 'bg-yellow-600 text-white' : 'border hover:bg-gray-50'}`}>
                                    {page}
                                </button>
                            );
                        })}
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-50">Next</button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <CreateOrderModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleOrderSubmit} />
            <EditOrderModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedOrderId(null); }}
                onSubmit={handleEditOrder}
                order={orders.find(o => o.order_id === selectedOrderId)}
            />
            <ViewOrderModal
                isOpen={isViewModalOpen}
                onClose={() => { setIsViewModalOpen(false); setSelectedOrderId(null); }}
                order={orders.find(o => o.order_id === selectedOrderId)}
                customer={customers[orders.find(o => o.order_id === selectedOrderId)?.customer_id]}
                createdBy={employees[orders.find(o => o.order_id === selectedOrderId)?.created_by]?.name || 'Unknown Employee'}
            />
        </div>
    );
};

export default OrderListTable;