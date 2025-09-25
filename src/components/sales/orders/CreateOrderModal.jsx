// CreateOrderModal.js
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from "react-hot-toast";

const CreateOrderModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        customer: "",
        phone: "",
        email: "",
        address: "",
        deliveryDate: "",
        items: [],
        amount: 0,
        paymentType: "Transfer",
    });
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemQuantities, setItemQuantities] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const customers = [
        { name: "Abdulrauf Fuad", phone: "+2348012345678", email: "fuad@gmail.com" },
        { name: "John Doe", phone: "+2348076543210", email: "john@gmail.com" },
        { name: "Irene Israel", phone: "+2348034567890", email: "irene@gmail.com" },
        { name: "Mary Smith", phone: "+2348098765432", email: "mary@gmail.com" },
        { name: "Victor Tobi", phone: "+2348054321098", email: "tobi@gmail.com" },
        { name: "Murtala Muhammad", phone: "+2348012345678", email: "murtala@gmail.com" },
        { name: "Ojo Danjuma", phone: "+2348076543210", email: "dan@gmail.com" },
        { name: "Okeke Chukwuma", phone: "+2348034567890", email: "chukwuma@gmail.com" },
        { name: "Amina Musa", phone: "+2348098765432", email: "amina@gmail.com" },
    ];
    const items = [
        { id: 1, name: "Wooden Dining Chair", price: 15000 },
        { id: 2, name: "Office Chair", price: 20000 },
        { id: 3, name: "Leather Recliner", price: 35000 },
        { id: 4, name: "Wooden Dining Table", price: 50000 },
        { id: 5, name: "Glass Coffee Table", price: 45000 },
        { id: 6, name: "Foldable Table", price: 25000 },
    ];

    useEffect(() => {
        if (formData.customer) {
            const selectedCustomer = customers.find(c => c.name === formData.customer);
            if (selectedCustomer) {
                setFormData(prev => ({
                    ...prev,
                    phone: selectedCustomer.phone,
                    email: selectedCustomer.email,
                }));
            }
        }
    }, [formData.customer]);

    useEffect(() => {
        const totalAmount = selectedItems.reduce((sum, itemId) => {
            const item = items.find(i => i.id === itemId);
            const quantity = itemQuantities[itemId] || 1;
            return sum + (item?.price || 0) * quantity;
        }, 0);
        setFormData(prev => ({ ...prev, amount: totalAmount }));
    }, [selectedItems, itemQuantities]);

    const handleCustomerChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, customer: value }));
        setFilteredCustomers(customers.filter(c => c.name.toLowerCase().includes(value.toLowerCase())));
    };

    const handleCustomerSelect = (customerName) => {
        setFormData(prev => ({ ...prev, customer: customerName }));
        setFilteredCustomers([]); // Close dropdown
    };

    const handleItemToggle = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleQuantityChange = (itemId, quantity) => {
        setItemQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
    };

    const generateOrderId = () => {
        return `#${Math.floor(100000 + Math.random() * 900000)}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const newOrder = {
                id: generateOrderId(),
                customer: formData.customer,
                address: formData.address,
                deliveryDate: formData.deliveryDate,
                paymentType: formData.paymentType,
                status: "Pending",
                phone: formData.phone,
                email: formData.email,
                items: selectedItems.map(itemId => ({
                    ...items.find(i => i.id === itemId),
                    quantity: itemQuantities[itemId] || 1,
                })),
                amount: formData.amount,
            };

            // Generate and download invoice
            const invoiceElement = document.createElement('div');
            invoiceElement.innerHTML = `
                <h2 style="text-align: center; color: #b88b1b;">Invoice</h2>
                <p><strong>Order ID:</strong> ${newOrder.id}</p>
                <p><strong>Customer:</strong> ${newOrder.customer}</p>
                <p><strong>Phone:</strong> ${newOrder.phone}</p>
                <p><strong>Email:</strong> ${newOrder.email}</p>
                <p><strong>Dispatch Address:</strong> ${newOrder.address}</p>
                <p><strong>Date of Delivery:</strong> ${newOrder.deliveryDate}</p>
                <p><strong>Payment Type:</strong> ${newOrder.paymentType}</p>
                <h3>Items:</h3>
                <ul>
                    ${newOrder.items.map(item => `
                        <li>${item.name} - Quantity: ${item.quantity} - Price: ₦${item.price} - Total: ₦${item.price * item.quantity}</li>
                    `).join('')}
                </ul>
                <p><strong>Total Amount:</strong> ₦${newOrder.amount}</p>
                <p style="text-align: center;">Thank you for your order!</p>
            `;
            invoiceElement.style.padding = '20px';
            invoiceElement.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(invoiceElement);

            const canvas = await html2canvas(invoiceElement);
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF();
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice_${newOrder.customer}_${newOrder.id}.pdf`);
            document.body.removeChild(invoiceElement);

            onSubmit(newOrder);
            toast.success("Order generated successfully!");
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            toast.error("Failed to generate invoice. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#b88b1b]">Create New Order</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Customer</label>
                        <input
                            type="text"
                            value={formData.customer}
                            onChange={handleCustomerChange}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            placeholder="Type to search customers..."
                            required
                        />
                        {formData.customer && filteredCustomers.length > 0 && (
                            <ul className="border border-gray-300 mt-1 rounded-md max-h-40 overflow-y-auto bg-white">
                                {filteredCustomers.map((customer) => (
                                    <li
                                        key={customer.name}
                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => handleCustomerSelect(customer.name)}
                                    >
                                        {customer.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                            type="text"
                            value={formData.phone}
                            readOnly
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            readOnly
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Dispatch Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Date of Delivery</label>
                        <input
                            type="date"
                            value={formData.deliveryDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Items</label>
                        {items.map(item => (
                            <div key={item.id} className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => handleItemToggle(item.id)}
                                    className="mr-2"
                                />
                                <span>{item.name} - ₦{item.price}</span>
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
                            value={formData.paymentType}
                            onChange={(e) => setFormData(prev => ({ ...prev, paymentType: e.target.value }))}
                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                        >
                            <option value="Transfer">Transfer</option>
                            <option value="Card">Card</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#b88b1b] hover:bg-[#8b6a15] transition-all text-white rounded-md"
                            disabled={isLoading}
                        >
                            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Submit Order"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="ml-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
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

export default CreateOrderModal;