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
        setFilteredCustomers([]);
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

    const generateInvoiceHTML = (newOrder) => {
        return `
        <div style="font-family: Arial, sans-serif; padding: 30px; background: white; color: #333; max-width: 100%;">
            <!-- Header Section -->
            <div style="display: flex; justify-content: center; margin-bottom: 30px; border-bottom: 3px solid #b88b1b; padding-bottom: 20px;">
            <img src="/madisonjayng_logo.png" alt="Company Logo" style="max-height: 60px; width: auto;" />
            </div>

            <!-- Invoice Title -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #b88b1b; font-size: 28px; margin: 0; border: 2px solid #b88b1b; display: inline-block; padding: 10px 30px; border-radius: 5px;">
                    INVOICE
                </h2>
            </div>

            <!-- Customer and Invoice Details -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 250px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>Invoice To:</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px;">
                        <p style="margin: 5px 0; font-weight: bold;">${newOrder.customer}</p>
                        <p style="margin: 5px 0;">${newOrder.address}</p>
                        <p style="margin: 5px 0;">Phone: ${newOrder.phone}</p>
                        <p style="margin: 5px 0;">Email: ${newOrder.email}</p>
                    </div>
                </div>

                <div style="flex: 1; min-width: 250px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>Invoice Details:</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px;">
                        <p style="margin: 5px 0;"><strong>Invoice No:</strong> ${newOrder.id}</p>
                        <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${newOrder.deliveryDate}</p>
                        <p style="margin: 5px 0;"><strong>Payment Type:</strong> ${newOrder.paymentType}</p>
                    </div>
                </div>

                <div style="flex: 1; min-width: 200px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0; text-align: center;">
                        <strong>TOTAL DUE</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; text-align: center;">
                        <p style="font-size: 24px; font-weight: bold; color: #b88b1b; margin: 0;">₦${newOrder.amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                    <thead>
                        <tr style="background: #b88b1b; color: white;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Item Description</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; width: 100px;">Price</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; width: 80px;">Qty</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; width: 120px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${newOrder.items.map((item, index) => `
                            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                                <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top;">
                                    <strong>${item.name}</strong>
                                    <br>
                                </td>
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; vertical-align: top;">₦${item.price.toLocaleString()}</td>
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; vertical-align: top;">${item.quantity}</td>
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; vertical-align: top; font-weight: bold;">₦${(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Summary Section -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;">
                <!-- Payment Information -->
                <div style="flex: 1; min-width: 300px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>PAYMENT INFORMATION</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px;">
                        <p style="margin: 8px 0;"><strong>Account No:</strong></p>
                        <p style="margin: 8px 0;"><strong>Account Name:</strong></p>
                        <p style="margin: 8px 0;"><strong>Bank Details:</strong></p>
                        <p style="margin: 8px 0;"><strong>Sort Code:</strong></p>
                    </div>
                </div>

                <!-- Total Calculation -->
                <div style="flex: 1; min-width: 250px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0; text-align: center;">
                        <strong>ORDER SUMMARY</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px;">
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>Sub Total:</span>
                            <span>₦${newOrder.amount.toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>VAT (0%):</span>
                            <span>₦0</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>Discount (0%):</span>
                            <span>₦0</span>
                        </div>
                        <hr style="border: none; border-top: 2px solid #b88b1b; margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 18px; font-weight: bold;">
                            <span>GRAND TOTAL:</span>
                            <span style="color: #b88b1b;">₦${newOrder.amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Section -->
            <div style="border-top: 3px solid #b88b1b; padding-top: 20px; margin-top: 30px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <p style="font-size: 18px; font-weight: bold; color: #b88b1b; margin: 0;">Thank you for your patronage!</p>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px;">
                    <!-- Terms -->
                    <div style="flex: 2; min-width: 300px;">
                        <p style="margin: 5px 0; font-weight: bold;">TERMS & CONDITIONS:</p>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">
                            Madison Jay is an established Nigerian furniture company that has successfully proven itself over the years in the procurement of high standard ergonomic office chairs, tables, work stations, ancillary & home furniture.
                        </p>
                    </div>

                    <!-- Signature -->
                    <div style="flex: 1; min-width: 200px; text-align: center;">
                        <p style="margin: 20px 0 5px 0; font-weight: bold;">TONY GREY</p>
                        <p style="margin: 0; color: #666;">Account Manager</p>
                        <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 10px;">
                            <p style="margin: 0; font-style: italic;">Signature</p>
                        </div>
                    </div>
                </div>

                <!-- Company Information -->
                <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 5px;">
                    <p style="margin: 5px 0; font-weight: bold; color: #b88b1b;">COMPANY INFORMATION</p>
                    <p style="margin: 3px 0; font-size: 12px;">13, Alhaij Kanike Close, off Awolowo Road, Ikoyi - Lagos</p>
                    <p style="margin: 3px 0; font-size: 12px;">Phone: +234-817-777-0017 | Email: sales@madisonjayng.com</p>
                    <p style="margin: 3px 0; font-size: 12px;">Website: www.company.com</p>
                </div>
            </div>
        </div>
        `;
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
            invoiceElement.innerHTML = generateInvoiceHTML(newOrder);
            invoiceElement.style.width = '210mm'; // A4 width
            invoiceElement.style.minHeight = '297mm'; // A4 height
            invoiceElement.style.margin = '0 auto';
            document.body.appendChild(invoiceElement);

            const canvas = await html2canvas(invoiceElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: invoiceElement.offsetWidth,
                height: invoiceElement.offsetHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice_${newOrder.customer}_${newOrder.id}.pdf`);
            document.body.removeChild(invoiceElement);

            onSubmit(newOrder);
            toast.success("Order generated successfully!");
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Invoice generation error:', error);
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
                    {/* ... rest of the form remains the same ... */}
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