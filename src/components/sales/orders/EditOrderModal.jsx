// components/sales/EditOrderModal.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLock } from '@fortawesome/free-solid-svg-icons';
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const EditOrderModal = ({ isOpen, onClose, onSubmit, order }) => {
    const [customer, setCustomer] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        delivery_status: "pending",
        payment_status: "unpaid",
        notes: ""
    });

    // Fetch customer
    useEffect(() => {
        const fetchCustomer = async () => {
            if (!order?.customer_id || !isOpen) return;
            try {
                const res = await apiService.getCustomerById(order.customer_id, router);
                if (res?.status === "success") setCustomer(res.data);
            } catch (err) {
                console.error("Failed to load customer:", err);
            }
        };
        fetchCustomer();
    }, [order?.customer_id, isOpen, router]);

    // Prefill form
    useEffect(() => {
        if (order && isOpen) {
            setFormData({
                delivery_status: order.delivery_status || "pending",
                payment_status: order.payment_status || "unpaid",
                notes: order.notes || ""
            });
        }
    }, [order, isOpen]);

    // === BUSINESS LOGIC: Can edit? ===
    const isPendingDelivery = order?.delivery_status === "pending";
    const isUnpaid = order?.payment_status === "unpaid";
    const isPaid = order?.payment_status === "paid";

    const canEditOrder = isPendingDelivery && (isUnpaid || isPaid);
    const canEditPaymentStatus = isPendingDelivery && isUnpaid; // Only unpaid → paid allowed

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading || !canEditOrder) return;

        setIsLoading(true);
        try {
            const payload = {
                delivery_status: formData.delivery_status,
                ...(canEditPaymentStatus && { payment_status: formData.payment_status }),
                notes: formData.notes.trim() || null
            };

            const res = await apiService.updateOrder(order.order_id, payload, router);

            if (res?.status === "success") {
                toast.success("Order updated successfully!");
                onSubmit?.(res.data?.[0] || order);
                setTimeout(onClose, 600);
            } else {
                throw new Error(res?.message || "Update failed");
            }
        } catch (err) {
            toast.error(err.message || "Failed to update order");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-amber-700">
                        Edit Order #{order.order_number}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Not Editable */}
                {!canEditOrder ? (
                    <div className="p-12 text-center">
                        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-10 max-w-lg mx-auto">
                            <div className="text-6xl mb-4">Locked</div>
                            <p className="text-2xl font-bold text-red-700 mb-4">
                                This order cannot be edited
                            </p>
                            <p className="text-gray-700 text-lg">
                                Only orders with <strong>Pending</strong> delivery status can be modified.
                            </p>
                            <div className="mt-6 bg-white rounded-xl p-5 shadow">
                                <p><strong>Delivery Status:</strong> <span className="capitalize font-bold text-red-600">{order.delivery_status}</span></p>
                                <p><strong>Payment Status:</strong> <span className="capitalize font-bold">{order.payment_status}</span></p>
                            </div>
                        </div>
                        <button onClick={onClose} className="mt-8 px-10 py-4 bg-amber-600 text-white text-lg rounded-xl hover:bg-amber-700">
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Customer Info */}
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200">
                            <h3 className="font-bold text-lg mb-4">Customer Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                <div><span className="text-gray-600">Name:</span> <strong>{customer?.name || "Loading..."}</strong></div>
                                <div><span className="text-gray-600">Phone:</span> <strong>{customer?.phone || order.phone_number}</strong></div>
                                <div><span className="text-gray-600">Email:</span> <strong>{customer?.email || "-"}</strong></div>
                                <div><span className="text-gray-600">Address:</span> <strong>{order.dispatch_address}</strong></div>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Delivery Status */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Delivery Status
                                    </label>
                                    <select
                                        value={formData.delivery_status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, delivery_status: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Payment Status */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        Payment Status
                                        {!canEditPaymentStatus && (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                                                <FontAwesomeIcon icon={faLock} className="text-xs" /> Locked
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        value={formData.payment_status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                                        disabled={!canEditPaymentStatus}
                                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-amber-100 transition ${
                                            canEditPaymentStatus 
                                                ? "border-gray-300 focus:border-amber-500 cursor-pointer" 
                                                : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                        }`}
                                    >
                                        <option value="unpaid">Unpaid</option>
                                        <option value="paid">Paid</option>
                                        <option value="refunded">Refunded</option>
                                    </select>
                                    {!canEditPaymentStatus && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Payment status cannot be changed after marking as Paid
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Internal Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 resize-none"
                                    placeholder="e.g. Customer requested express delivery..."
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !canEditOrder}
                                className="px-10 py-4 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium disabled:opacity-50 flex items-center gap-3"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditOrderModal;