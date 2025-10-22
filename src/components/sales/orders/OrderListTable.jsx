import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faEye, faEdit, faTrash, faRefresh } from '@fortawesome/free-solid-svg-icons';
import CreateOrderModal from "./CreateOrderModal";
import EditOrderModal from "./EditOrderModal";
import ViewOrderModal from "./ViewOrderModal";
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const OrderListTable = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [customers, setCustomers] = useState({});
    const [employees, setEmployees] = useState({});
    const itemsPerPage = 12;
    const router = useRouter();

    // Skeleton rows for loading state
    const skeletonRows = Array.from({ length: 8 }, (_, i) => i);

    // Fetch customer details
    const fetchCustomerDetails = async (customerId) => {
        try {
            const response = await apiService.getCustomerById(customerId, router);
            const data = response.data || response;
            return {
                name: data.name || 'Unknown Customer',
                email: data.email || '',
                phone: data.phone_number || ''
            };
        } catch (error) {
            console.error(`Error fetching customer ${customerId}:`, error);
            return { name: 'Unknown Customer', email: '', phone: '' };
        }
    };

    // Fetch employee details
    const fetchEmployeeDetails = async (employeeId) => {
        try {
            const response = await apiService.getEmployeeById(employeeId, router);
            const data = response.data || response;
            return {
                name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown Employee'
            };
        } catch (error) {
            console.error(`Error fetching employee ${employeeId}:`, error);
            return { name: 'Unknown Employee' };
        }
    };

    // Fetch orders from backend
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders(router);
            if (response.status === "success") {
                const ordersData = response.data || [];
                setOrders(ordersData);

                // Get unique customer and employee ids
                const customerIds = [...new Set(ordersData.map(order => order.customer_id).filter(id => id))];
                const employeeIds = [...new Set(ordersData.map(order => order.created_by).filter(id => id))];

                // Fetch customers
                const customersData = await Promise.all(
                    customerIds.map(async (id) => {
                        const data = await fetchCustomerDetails(id);
                        return [id, data];
                    })
                );
                const customersMap = Object.fromEntries(customersData);

                // Fetch employees
                const employeesData = await Promise.all(
                    employeeIds.map(async (id) => {
                        const data = await fetchEmployeeDetails(id);
                        return [id, data];
                    })
                );
                const employeesMap = Object.fromEntries(employeesData);

                // Update state
                setCustomers((prev) => ({ ...prev, ...customersMap }));
                setEmployees((prev) => ({ ...prev, ...employeesMap }));
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

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'text-orange-500';
            case 'processing':
                return 'text-yellow-500';
            case 'shipped':
                return 'text-purple-500';
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

    const formatOrderData = (order) => {
        const customer = customers[order.customer_id] || { name: 'Unknown Customer', email: '', phone: '' };
        const employee = employees[order.created_by] || { name: 'Unknown Employee' };

        return {
            id: order.order_id,
            order_number: order.order_number,
            customer: customer.name,
            customer_id: order.customer_id,
            address: order.dispatch_address,
            deliveryDate: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set',
            status: order.status,
            phone: customer.phone || order.phone_number,
            email: customer.email,
            items: order.order_details?.map(detail => ({
                id: detail.product_id?.id || detail.product_id,
                name: detail.product_id?.name || 'Product',
                price: detail.product_id?.price || 0,
                quantity: detail.quantity
            })) || [],
            amount: order.total_amount,
            additional_costs: order.additional_costs || 0,
            notes: order.notes,
            created_by: employee.name,
            created_at: order.created_at ? new Date(order.created_at).toLocaleString() : 'Not set',
            created_by_id: order.created_by,
            originalData: order
        };
    };

    const filteredOrders = orders
        .map(formatOrderData)
        .filter(order =>
            order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.deliveryDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleOrderSubmit = async (newOrderData) => {
        try {
            const response = await apiService.createOrder(newOrderData, router);
            if (response.status === "success") {
                await fetchOrders();
                setIsCreateModalOpen(false);
                toast.success("Order created successfully!");
            } else {
                toast.error(response.message || "Failed to create order");
            }
        } catch (error) {
            console.error("Error creating order:", error);
            toast.error(error.message);
        }
    };

    const handleEditOrder = async (updatedOrderData) => {
        try {
            const response = await apiService.updateOrder(selectedOrderId, updatedOrderData, router);
            if (response.status === "success") {
                await fetchOrders();
                setIsEditModalOpen(false);
                setSelectedOrderId(null);
                toast.success("Order updated successfully!");
            } else {
                toast.error(response.message || "Failed to update order");
            }
        } catch (error) {
            console.error("Error updating order:", error);
            toast.error(error.message);
        }
    };

    const openEditModal = (orderId) => {
        setSelectedOrderId(orderId);
        setIsEditModalOpen(true);
    };

    const openViewModal = (orderId) => {
        setSelectedOrderId(orderId);
        setIsViewModalOpen(true);
    };

    const canEditOrder = (status) => {
        return status?.toLowerCase() === 'pending' || status?.toLowerCase() === 'unpaid';
    };

    return (
        <div>
            <div className="flex justify-between items-center my-10">
                <h2 className="text-lg font-bold">Order Table</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <button
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Create sales order
                    </button>
                    <button
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={fetchOrders}
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faRefresh} className="mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full text-left table-auto">
                    <thead>
                        <tr className="text-gray-600 text-sm border-b border-gray-300">
                            <th className="pb-4 px-4 whitespace-nowrap">Order Number</th>
                            <th className="pb-4 px-4 whitespace-nowrap">Customer Name</th>
                            <th className="pb-4 px-4">Dispatch Address</th>
                            <th className="pb-4 px-4 whitespace-nowrap">Date of Delivery</th>
                            <th className="pb-4 px-4 whitespace-nowrap">Created By</th>
                            <th className="pb-4 px-4 whitespace-nowrap">Created At</th>
                            <th className="pb-4 px-4 whitespace-nowrap">Status</th>
                            <th className="pb-4 px-4 whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            skeletonRows.map((index) => (
                                <tr key={index} className="border-b border-gray-300 animate-pulse">
                                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-40"></div></td>
                                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                    <td className="py-5 px-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                                    <td className="py-5 px-4"><div className="h-6 bg-gray-200 rounded w-24"></div></td>
                                    <td className="py-4 px-4 flex space-x-4 mt-2">
                                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                                        <div className="h-5 w-5 bg-gray-200 rounded"></div>
                                    </td>
                                </tr>
                            ))
                        ) : currentOrders.length > 0 ? (
                            currentOrders.map((order, index) => (
                                <tr key={order.id} className="border-b border-gray-300">
                                    <td className="py-5 px-4 font-mono whitespace-nowrap">{order.order_number}</td>
                                    <td className="py-5 px-4 whitespace-nowrap">{order.customer}</td>
                                    <td className="py-5 px-4 whitespace-nowrap">{order.address || 'Not specified'}</td>
                                    <td className="py-5 px-4 whitespace-nowrap">{order.deliveryDate}</td>
                                    <td className="py-5 px-4 whitespace-nowrap">{order.created_by}</td>
                                    <td className="py-5 px-4 whitespace-nowrap">{order.created_at}</td>
                                    <td className="py-5 px-4 whitespace-nowrap">
                                        <span className={getStatusColor(order.status)}>
                                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 flex space-x-4 mt-2">
                                        <FontAwesomeIcon
                                            icon={faEye}
                                            className="text-blue-500 cursor-pointer hover:text-blue-700"
                                            onClick={() => openViewModal(order.id)}
                                            title="View Order"
                                        />
                                        {canEditOrder(order.status) ? (
                                            <FontAwesomeIcon
                                                icon={faEdit}
                                                className="text-green-500 cursor-pointer hover:text-green-700"
                                                onClick={() => openEditModal(order.id)}
                                                title="Edit Order"
                                            />
                                        ) : (
                                            <FontAwesomeIcon
                                                icon={faEdit}
                                                className="text-gray-400 cursor-not-allowed"
                                                title="Cannot edit - Order not pending or processing"
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                                    {orders.length === 0 ? "No orders found" : "No orders match your search"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && totalPages > 1 && (
                <div className="mt-4 flex justify-center items-center">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-[#b88b1b] text-white hover:bg-[#8b6a15] transition-all rounded-md mr-2 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`px-3 py-1 mx-1 rounded-md ${currentPage === page ? 'bg-[#b88b1b] text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-[#b88b1b] text-white hover:bg-[#8b6a15] transition-all rounded-md ml-2 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            <CreateOrderModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleOrderSubmit}
            />
            <EditOrderModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedOrderId(null);
                }}
                onSubmit={handleEditOrder}
                order={orders.find(o => o.order_id === selectedOrderId)}
            />
            <ViewOrderModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedOrderId(null);
                }}
                order={orders.find(o => o.order_id === selectedOrderId)}
                customer={customers[orders.find(o => o.order_id === selectedOrderId)?.customer_id]}
                createdById={orders.find(o => o.order_id === selectedOrderId)?.created_by}
            />
        </div>
    );
};

export default OrderListTable;