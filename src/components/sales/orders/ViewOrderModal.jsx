import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ViewOrderModal = ({ isOpen, onClose, order }) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (order) {
            setIsLoading(false);
        }
    }, [order]);

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

    if (!isOpen) return null;

    if (isLoading) return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        </div>
    );

    if (!order) return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <button onClick={onClose} className="mb-4 px-4 py-2 bg-[#b88b1b] text-white rounded-md">
                    <FontAwesomeIcon icon={faTimes} className="mr-2" /> Close
                </button>
                <p className="text-center text-red-500">Order not found</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#b88b1b]">View Order {order.id}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="space-y-3">
                    <p><strong>Customer:</strong> {order.customer}</p>
                    <p><strong>Dispatch Address:</strong> {order.address}</p>
                    <p><strong>Date of Delivery:</strong> {order.deliveryDate}</p>
                    <p><strong>Payment Type:</strong> {order.paymentType}</p>
                    <p><strong>Status:</strong> <span className={getStatusColor(order.status)}>{order.status}</span></p>
                    <p className="mt-4"><strong>Items:</strong></p>
                    {order.items && order.items.length > 0 ? (
                        <ul className="list-disc pl-5">
                            {order.items.map((item, index) => (
                                <li key={index}>
                                    {item.name} <br /> Quantity: {item.quantity} <br /> Price: ₦{item.price.toLocaleString()} <br /> <b>Total: ₦{(item.price * item.quantity).toLocaleString()}</b>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No items in this order</p>
                    )}
                    <p className="mt-2"><strong>Total Amount:</strong> ₦{order.amount.toLocaleString()}</p>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-500 transition-all hover:text-white text-gray-700 rounded-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewOrderModal;