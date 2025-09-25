import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import toast from "react-hot-toast";

const EditOrderModal = ({ isOpen, onClose, onSubmit, order }) => {
    const [formData, setFormData] = useState({
        address: "",
        deliveryDate: "",
        paymentType: "Transfer",
        items: [],
        amount: 0,
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemQuantities, setItemQuantities] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const itemsList = [
        { id: 1, name: "Wooden Dining Chair", price: 15000 },
        { id: 2, name: "Office Chair", price: 20000 },
        { id: 3, name: "Leather Recliner", price: 35000 },
        { id: 4, name: "Wooden Dining Table", price: 50000 },
        { id: 5, name: "Glass Coffee Table", price: 45000 },
        { id: 6, name: "Foldable Table", price: 25000 },
    ];

    useEffect(() => {
        if (order && order.status === "Pending") {
            const initialItems = order.items.map(item => item.id);
            const initialQuantities = order.items.reduce((acc, item) => ({
                ...acc,
                [item.id]: item.quantity,
            }), {});
            setFormData({
                address: order.address,
                deliveryDate: order.deliveryDate,
                paymentType: order.paymentType,
                items: order.items,
                amount: order.amount,
            });
            setSelectedItems(initialItems);
            setItemQuantities(initialQuantities);
        }
        setIsLoading(false);
    }, [order]);

    useEffect(() => {
        const totalAmount = selectedItems.reduce((sum, itemId) => {
            const item = itemsList.find(i => i.id === itemId);
            const quantity = itemQuantities[itemId] || 1;
            return sum + (item?.price || 0) * quantity;
        }, 0);
        setFormData(prev => ({ ...prev, amount: totalAmount }));
    }, [selectedItems, itemQuantities]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemToggle = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleQuantityChange = (itemId, quantity) => {
        setItemQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (order.status !== "Pending") {
                toast.error("Cannot edit order with status other than Pending");
                return;
            }
            const updatedOrder = {
                ...order,
                ...formData,
                items: selectedItems.map(itemId => ({
                    ...itemsList.find(i => i.id === itemId),
                    quantity: itemQuantities[itemId] || 1,
                })),
            };
            onSubmit(updatedOrder);
        } catch (error) {
            toast.error("Failed to update order. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    if (isLoading) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        </div>
    );

    if (!order || order.status !== "Pending") {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <button onClick={onClose} className="mb-4 px-4 py-2 bg-[#b88b1b] text-white rounded-md">
                        <FontAwesomeIcon icon={faTimes} className="mr-2" /> Close
                    </button>
                    <p className="text-center text-red-500">Order cannot be edited (Status: {order?.status || "Not Found"})</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-[#b88b1b]">Edit Order {order.id}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSave}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Dispatch Address</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Date of Delivery</label>
                        <input
                            type="date"
                            name="deliveryDate"
                            value={formData.deliveryDate}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Items</label>
                        {itemsList.map(item => (
                            <div key={item.id} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => handleItemToggle(item.id)}
                                    className="mr-2"
                                />
                                <span>{item.name} - ₦{item.price.toLocaleString()}</span>
                                {selectedItems.includes(item.id) && (
                                    <input
                                        type="number"
                                        min="1"
                                        value={itemQuantities[item.id] || 1}
                                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                        className="ml-2 p-1 border border-gray-300 rounded-md w-16"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                        <input
                            type="text"
                            value={`₦${formData.amount.toLocaleString()}`}
                            readOnly
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                        <select
                            name="paymentType"
                            value={formData.paymentType}
                            onChange={handleChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                        >
                            <option value="Transfer">Transfer</option>
                            <option value="Card">Card</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#b88b1b] hover:bg-[#8b6a15] transition-all text-white rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
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