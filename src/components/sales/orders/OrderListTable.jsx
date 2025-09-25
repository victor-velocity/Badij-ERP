import React, { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import CreateOrderModal from "./CreateOrderModal";
import EditOrderModal from "./EditOrderModal";
import DeleteOrderModal from "./DeleteOrderConfirmation";
import ViewOrderModal from "./ViewOrderModal";
import toast from "react-hot-toast";

const OrderListTable = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const itemsPerPage = 12;

    const [orders, setOrders] = useState([
        {
            id: "#412346",
            customer: "Abdulrauf Fuad",
            address: "12 Lagos Street, Lagos",
            deliveryDate: "24 Aug, 2025",
            paymentType: "Transfer",
            status: "Shipped to customer",
            phone: "+2348012345678",
            email: "fuad@gmail.com",
            items: [
                { id: 1, name: "Wooden Dining Chair", price: 15000, quantity: 2 },
                { id: 4, name: "Wooden Dining Table", price: 50000, quantity: 1 },
            ],
            amount: 80000, // (15000 * 2) + (50000 * 1)
        },
        {
            id: "#413246",
            customer: "John Doe",
            address: "15 Lagos Avenue, Lagos",
            deliveryDate: "28 Aug, 2025",
            paymentType: "Card",
            status: "Inventory arrangement",
            phone: "+2348076543210",
            email: "john@gmail.com",
            items: [
                { id: 2, name: "Office Chair", price: 20000, quantity: 3 },
            ],
            amount: 60000, // (20000 * 3)
        },
        {
            id: "#412347",
            customer: "Irene Israel",
            address: "20 Abuja Road, Abuja",
            deliveryDate: "31 Aug, 2025",
            paymentType: "Card",
            status: "In transit",
            phone: "+2348034567890",
            email: "irene@gmail.com",
            items: [
                { id: 3, name: "Leather Recliner", price: 35000, quantity: 1 },
                { id: 5, name: "Glass Coffee Table", price: 45000, quantity: 1 },
            ],
            amount: 80000, // (35000 * 1) + (45000 * 1)
        },
        {
            id: "#413248",
            customer: "Mary Smith",
            address: "10 Akwa Street, Akwa",
            deliveryDate: "2 Sep, 2025",
            paymentType: "Cash",
            status: "Pending",
            phone: "+2348098765432",
            email: "mary@gmail.com",
            items: [
                { id: 6, name: "Foldable Table", price: 25000, quantity: 2 },
            ],
            amount: 50000, // (25000 * 2)
        },
        {
            id: "#413249",
            customer: "Victor Tobi",
            address: "5 Abuja Lane, Abuja",
            deliveryDate: "7 Sep, 2025",
            paymentType: "Transfer",
            status: "Pending",
            phone: "+2348054321098",
            email: "tobi@gmail.com",
            items: [
                { id: 1, name: "Wooden Dining Chair", price: 15000, quantity: 4 },
            ],
            amount: 60000, // (15000 * 4)
        },
        {
            id: "#412351",
            customer: "Murtala Muhammad",
            address: "8 Kano Road, Kano",
            deliveryDate: "10 Sep, 2025",
            paymentType: "Card",
            status: "Shipped to customer",
            phone: "+2348012345678",
            email: "murtala@gmail.com",
            items: [
                { id: 4, name: "Wooden Dining Table", price: 50000, quantity: 1 },
                { id: 1, name: "Wooden Dining Chair", price: 15000, quantity: 4 },
            ],
            amount: 110000, // (50000 * 1) + (15000 * 4)
        },
        {
            id: "#412352",
            customer: "Ojo Danjuma",
            address: "3 Badan Street, Badan",
            deliveryDate: "12 Sep, 2025",
            paymentType: "Transfer",
            status: "Ready for dispatch",
            phone: "+2348076543210",
            email: "dan@gmail.com",
            items: [
                { id: 2, name: "Office Chair", price: 20000, quantity: 2 },
                { id: 5, name: "Glass Coffee Table", price: 45000, quantity: 1 },
            ],
            amount: 85000, // (20000 * 2) + (45000 * 1)
        },
        {
            id: "#413250",
            customer: "Okeke Chukwuma",
            address: "7 Anambra Avenue, Anambra",
            deliveryDate: "13 Sep, 2025",
            paymentType: "Card",
            status: "Inventory arrangement",
            phone: "+2348034567890",
            email: "chukwuma@gmail.com",
            items: [
                { id: 3, name: "Leather Recliner", price: 35000, quantity: 2 },
            ],
            amount: 70000, // (35000 * 2)
        },
        {
            id: "#412353",
            customer: "Amina Musa",
            address: "4 Abuja Drive, Abuja",
            deliveryDate: "20 Sep, 2025",
            paymentType: "Cash",
            status: "In transit",
            phone: "+2348098765432",
            email: "amina@gmail.com",
            items: [
                { id: 6, name: "Foldable Table", price: 25000, quantity: 3 },
            ],
            amount: 75000, // (25000 * 3)
        },
    ]);

    const getStatusColor = (status) => {
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

    const filteredOrders = orders.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.paymentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleOrderSubmit = (newOrder) => {
        setOrders(prev => [...prev, newOrder]);
        setIsCreateModalOpen(false);
        toast.success("Order created successfully!");
    };

    const handleEditOrder = (updatedOrder) => {
        if (updatedOrder.status !== "Pending") {
            toast.error("Cannot edit order with status other than Pending");
            return;
        }
        setOrders(prev =>
            prev.map(o => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        setIsEditModalOpen(false);
        setSelectedOrderId(null);
        toast.success("Order updated successfully!");
    };

    const handleDeleteOrder = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (order.status !== "Pending") {
            toast.error("Cannot delete order with status other than Pending");
            return;
        }
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setIsDeleteModalOpen(false);
        setSelectedOrderId(null);
        toast.success("Order deleted successfully!");
    };

    const openEditModal = (orderId) => {
        setSelectedOrderId(orderId);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (orderId) => {
        setSelectedOrderId(orderId);
        setIsDeleteModalOpen(true);
    };

    const openViewModal = (orderId) => {
        setSelectedOrderId(orderId);
        setIsViewModalOpen(true);
    };

    return (
        <div className="rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-10">
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
                        />
                    </div>
                    <button
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Create sales order
                    </button>
                </div>
            </div>
            <table className="w-full text-left table-auto">
                <thead>
                    <tr className="text-gray-600 text-sm border-b border-gray-300">
                        <th className="pb-4">Order ID</th>
                        <th className="pb-4">Customer name</th>
                        <th className="pb-4">Dispatch address</th>
                        <th className="pb-4">Date of Delivery</th>
                        <th className="pb-4">Payment type</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentOrders.length > 0 ? (
                        currentOrders.map((order, index) => (
                            <tr key={index} className="border-b border-gray-300">
                                <td className="py-5">{order.id}</td>
                                <td className="py-5">{order.customer}</td>
                                <td className="py-5">{order.address}</td>
                                <td className="py-5">{order.deliveryDate}</td>
                                <td className="py-5">{order.paymentType}</td>
                                <td className="py-5">
                                    <span className={getStatusColor(order.status)}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="py-4 flex space-x-4 mt-2">
                                    <FontAwesomeIcon
                                        icon={faEye}
                                        className="text-blue-500 cursor-pointer"
                                        onClick={() => openViewModal(order.id)}
                                    />
                                    {order.status === 'Pending' && (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faEdit}
                                                className="text-green-500 cursor-pointer"
                                                onClick={() => openEditModal(order.id)}
                                            />
                                            <FontAwesomeIcon
                                                icon={faTrash}
                                                className="text-red-500 cursor-pointer"
                                                onClick={() => openDeleteModal(order.id)}
                                            />
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="py-4 text-center text-gray-500">
                                No orders found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
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
                order={orders.find(o => o.id === selectedOrderId)}
            />
            <DeleteOrderModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedOrderId(null);
                }}
                onDelete={handleDeleteOrder}
                order={orders.find(o => o.id === selectedOrderId)}
            />
            <ViewOrderModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedOrderId(null);
                }}
                order={orders.find(o => o.id === selectedOrderId)}
            />
        </div>
    );
};

export default OrderListTable;