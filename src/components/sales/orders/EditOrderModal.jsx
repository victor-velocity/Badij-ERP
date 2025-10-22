import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const EditOrderModal = ({ isOpen, onClose, onSubmit, order }) => {
    const [formData, setFormData] = useState({
        status: "unpaid",
        notes: "",
        payment_type: "cash"
    });
    const [customer, setCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Fetch customer data on modal open
    useEffect(() => {
        const fetchCustomer = async () => {
            if (!order?.customer_id || !isOpen) return;
            
            try {
                const response = await apiService.getCustomerById(order.customer_id, router);
                if (response.status === "success") {
                    setCustomer(response.data);
                }
            } catch (error) {
                console.error("Error fetching customer:", error);
            }
        };

        fetchCustomer();
    }, [order?.customer_id, isOpen, router]);

    // Prefill form when order changes
    useEffect(() => {
        if (order && isOpen) {
            setFormData({
                status: order.status || "unpaid",
                notes: order.notes || "",
                payment_type: order.payment_type || "cash" // ✅ NEW: Prefill payment type
            });
        }
    }, [order, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // ✅ NOW SEND status, notes, AND payment_type
            const updateData = {
                status: formData.status,
                notes: formData.notes || "",
                payment_type: formData.payment_type
            };

            const response = await apiService.updateOrder(order.order_id, updateData, router);
            
            if (response.status === "success") {
                onSubmit(response.data);
                toast.success("Order updated successfully!");
                setTimeout(() => onClose(), 1000);
            } else {
                toast.error(response.message || "Failed to update order");
            }
        } catch (error) {
            console.error('Order update error:', error);
            toast.error("Failed to update order");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !order) return null;

    if (order.status?.toLowerCase() !== "unpaid") {
        return (
            <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-[#b88b1b]">Edit Order</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                    <p className="text-center text-red-500 py-4">
                        Only <strong>UNPAID</strong> orders can be edited
                        <br />
                        <small className="text-gray-600">Current: {order.status}</small>
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-[#8b6a15]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#b88b1b]">Edit Order {order.order_number}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* ✅ PREFILL SECTION - READ ONLY */}
                    <div className="bg-gray-50 p-4 rounded-md mb-6">
                        <h3 className="font-medium text-gray-700 mb-4">Customer Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={customer?.name || order.customer_name || 'Loading...'}
                                    readOnly
                                    className="p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={customer?.email || ''}
                                    readOnly
                                    className="p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={customer?.phone || order.phone_number || ''}
                                    readOnly
                                    className="p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={order.dispatch_address || ''}
                                    readOnly
                                    className="p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ✅ EDITABLE SECTION */}
                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                    required
                                >
                                    <option value="unpaid">Unpaid</option>
                                    <option value="processing">Processing</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Can only update to Processing</p>
                            </div>

                            {/* ✅ NEW: PAYMENT TYPE FIELD */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type *</label>
                                <select
                                    value={formData.payment_type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, payment_type: e.target.value }))}
                                    className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                    required
                                >
                                    <option value="cash">Cash</option>
                                    <option value="transfer">Bank Transfer</option>
                                    <option value="card">Card</option>
                                    <option value="pos">POS</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                rows="3"
                                placeholder="Additional notes about this order..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-[#b88b1b] hover:bg-[#8b6a15] text-white rounded-md disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditOrderModal;