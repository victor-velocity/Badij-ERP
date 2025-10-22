// CreateOrderModal.js
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faSearch, faTrash, faEnvelope, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const CreateOrderModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        customer_id: "",
        delivery_date: "",
        total_amount: 0,
        dispatch_address: "",
        phone_number: "",
        notes: "",
        products: []
    });
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerQuery, setCustomerQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemQuantities, setItemQuantities] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [status, setStatus] = useState("unpaid");
    const [paymentType, setPaymentType] = useState("transfer");
    const [additionalCosts, setAdditionalCosts] = useState([]);
    const [newCostName, setNewCostName] = useState("");
    const [newCostPrice, setNewCostPrice] = useState(0);
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankName, setBankName] = useState("");
    const router = useRouter();

    // Fetch customers and products from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true);
                const [customersResponse, productsResponse] = await Promise.all([
                    apiService.getCustomers(router),
                    apiService.getProducts(router)
                ]);

                if (customersResponse.status === "success") {
                    setCustomers(customersResponse.data || []);
                }

                if (productsResponse.status === "success") {
                    setProducts(productsResponse.data || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Failed to load customers and products");
            } finally {
                setLoadingData(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, router]);

    useEffect(() => {
        const itemsTotal = selectedItems.reduce((sum, item) => {
            const quantity = itemQuantities[item.product_id] || 1;
            const price = item.price || 0;
            return sum + price * quantity;
        }, 0);
        const additionalTotal = additionalCosts.reduce((sum, cost) => sum + (cost.price || 0), 0);
        const totalAmount = itemsTotal + additionalTotal;
        setFormData(prev => ({ ...prev, total_amount: totalAmount }));
    }, [selectedItems, itemQuantities, additionalCosts]);

    // Search functionality for products only
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = products.filter(product =>
            product.name?.toLowerCase().includes(searchLower) ||
            product.sku?.toLowerCase().includes(searchLower)
        );

        setSearchResults(filtered);
    }, [searchTerm, products]);

    const handleCustomerChange = (e) => {
        const value = e.target.value;
        setCustomerQuery(value);
        if (value.trim() === "") {
            setSelectedCustomer(null);
            setFormData(prev => ({ 
                ...prev, 
                customer_id: "", 
                phone_number: "", 
                dispatch_address: "" 
            }));
            setFilteredCustomers([]);
            return;
        }
        setFilteredCustomers(
            customers.filter(c => 
                c.name?.toLowerCase().includes(value.toLowerCase())
            )
        );
    };

    const handleCustomerSelect = (customerId) => {
        const customer = customers.find(c => c.customer_id === customerId);
        if (customer) {
            setSelectedCustomer(customer);
            setFormData(prev => ({
                ...prev,
                customer_id: customerId,
                phone_number: customer.phone || '',
                dispatch_address: ''
            }));
            setCustomerQuery(customer.name);
            setFilteredCustomers([]);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleItemSelect = (product) => {
        if (selectedItems.some(selected => selected.product_id === product.product_id)) {
            toast.error("Product already added to order");
            return;
        }

        setSelectedItems(prev => [...prev, product]);
        setItemQuantities(prev => ({ ...prev, [product.product_id]: 1 }));
        setSearchTerm("");
        setSearchResults([]);
    };

    const handleQuantityChange = (productId, quantity) => {
        const newQuantity = Math.max(1, quantity);
        setItemQuantities(prev => ({ 
            ...prev, 
            [productId]: newQuantity 
        }));
    };

    const handleRemoveItem = (productId) => {
        setSelectedItems(prev => prev.filter(item => item.product_id !== productId));
        setItemQuantities(prev => {
            const newQuantities = { ...prev };
            delete newQuantities[productId];
            return newQuantities;
        });
    };

    const handleAddAdditionalCost = () => {
        if (!newCostName.trim() || newCostPrice <= 0) {
            toast.error("Please enter valid cost name and price");
            return;
        }
        setAdditionalCosts(prev => [...prev, { name: newCostName, price: newCostPrice }]);
        setNewCostName('');
        setNewCostPrice(0);
    };

    const handleRemoveAdditionalCost = (index) => {
        setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
    };

    const generateInvoiceHTML = (orderData, customerData, itemsData, additionalCosts) => {
        let additionalHtml = '';
        if (additionalCosts.length > 0) {
            additionalHtml = additionalCosts.map(cost => `
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span>${cost.name}:</span>
                    <span>₦${cost.price.toLocaleString()}</span>
                </div>
            `).join('');
        }

        const paymentInfoHtml = `
            <p style="margin: 5px 0;"><strong>Account Name:</strong> ${accountName}</p>
            <p style="margin: 5px 0;"><strong>Account Number:</strong> ${accountNumber}</p>
            <p style="margin: 5px 0;"><strong>Bank:</strong> ${bankName}</p>
            <p style="margin: 5px 0; color: #666;">${orderData.notes || 'No additional notes provided.'}</p>
        `;

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
                <div style="flex: 1; min-width: 250px; min-height: 180px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>Invoice To:</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; height: calc(100% - 42px);">
                        <p style="margin: 5px 0; font-weight: bold;">${customerData?.name || 'N/A'}</p>
                        <p style="margin: 5px 0;">${orderData.dispatch_address}</p>
                        <p style="margin: 5px 0;">Phone: ${orderData.phone_number}</p>
                        <p style="margin: 5px 0;">Email: ${customerData?.email || 'N/A'}</p>
                    </div>
                </div>

                <div style="flex: 1; min-width: 250px; min-height: 180px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>Invoice Details:</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; height: calc(100% - 42px);">
                        <p style="margin: 5px 0;"><strong>Order No:</strong> ${orderData.order_number}</p>
                        <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${orderData.delivery_date || 'Not set'}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> ${orderData.status}</p>
                    </div>
                </div>

                <div style="flex: 1; min-width: 200px; min-height: 180px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0; text-align: center;">
                        <strong>TOTAL DUE</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; height: calc(100% - 42px); display: flex; align-items: center; justify-content: center;">
                        <p style="font-size: 24px; font-weight: bold; color: #b88b1b; margin: 0;">₦${orderData.total_amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                    <thead>
                        <tr style="background: #b88b1b; color: white;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Product Description</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; width: 100px;">Price</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; width: 80px;">Qty</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; width: 120px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsData.map((item, index) => `
                            <tr style="${index % 2 === 0 ? 'background: #f9f9f9;' : ''}">
                                <td style="padding: 12px; border: 1px solid #ddd; vertical-align: top;">
                                    <strong>${item.name}</strong>
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
                <!-- Payment Information (replacing Order Notes) -->
                <div style="flex: 1; min-width: 300px; min-height: 200px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>PAYMENT INFORMATION</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; height: calc(100% - 42px);">
                        ${paymentInfoHtml}
                    </div>
                </div>

                <!-- Total Calculation -->
                <div style="flex: 1; min-width: 250px; min-height: 200px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0; text-align: center;">
                        <strong>ORDER SUMMARY</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; height: calc(100% - 42px);">
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>Sub Total:</span>
                            <span>₦${orderData.total_amount.toLocaleString()}</span>
                        </div>
                        ${additionalHtml}
                        <hr style="border: none; border-top: 2px solid #b88b1b; margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 18px; font-weight: bold;">
                            <span>GRAND TOTAL:</span>
                            <span style="color: #b88b1b;">₦${orderData.total_amount.toLocaleString()}</span>
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
                            Payment is due within 30 days of invoice date. Late payments may be subject to fees. All orders are subject to availability. Delivery times are estimates and may vary.
                        </p>
                    </div>

                    <!-- Signature -->
                    <div style="flex: 1; min-width: 200px; text-align: center;">
                        <p style="margin: 20px 0 5px 0; font-weight: bold;">MADISON JAY</p>
                        <p style="margin: 0; color: #666;">Furniture Company</p>
                        <div style="margin-top: 40px; border-top: 1px solid #333; padding-top: 10px;">
                            <p style="margin: 0; font-style: italic;">Authorized Signature</p>
                        </div>
                    </div>
                </div>

                <!-- Company Information -->
                <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 5px;">
                    <p style="margin: 5px 0; font-weight: bold; color: #b88b1b;">MADISON JAY FURNITURE</p>
                    <p style="margin: 3px 0; font-size: 12px;">13, Alhaij Kanike Close, off Awolowo Road, Ikoyi - Lagos</p>
                    <p style="margin: 3px 0; font-size: 12px;">Phone: +234-817-777-0017 | Email: sales@madisonjayng.com</p>
                    <p style="margin: 3px 0; font-size: 12px;">Website: www.madisonjayng.com</p>
                </div>
            </div>
        </div>
        `;
    };

    const sendInvoiceEmail = async (orderData, customerData, pdfBlob) => {
        try {
            setSendingEmail(true);
            
            const formData = new FormData();
            formData.append('customer_email', customerData.email);
            formData.append('customer_name', customerData.name);
            formData.append('order_number', orderData.order_number);
            formData.append('total_amount', orderData.total_amount);
            formData.append('invoice_pdf', pdfBlob, `invoice_${orderData.order_number}.pdf`);

            const response = await apiService.sendInvoiceEmail(formData, router);
            
            if (response.status === "success") {
                toast.success("Invoice sent to customer's email successfully!");
                return true;
            } else {
                toast.error("Failed to send invoice email");
                return false;
            }
        } catch (error) {
            console.error('Error sending invoice email:', error);
            toast.error("Failed to send invoice email");
            return false;
        } finally {
            setSendingEmail(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedItems.length === 0) {
            toast.error("Please select at least one product");
            return;
        }

        if (!formData.customer_id) {
            toast.error("Please select a customer");
            return;
        }

        setIsLoading(true);
        try {
            // Prepare data for backend
            const additionalTotal = additionalCosts.reduce((sum, cost) => sum + (cost.price || 0), 0);
            const orderData = {
                customer_id: formData.customer_id,
                delivery_date: formData.delivery_date || null,
                status: status,
                total_amount: formData.total_amount,
                dispatch_address: formData.dispatch_address,
                phone_number: formData.phone_number,
                notes: formData.notes || "",
                additional_costs: additionalTotal,
                ...(status === 'processing' && { payment_type: paymentType }),
                // REMOVED: payment_details from submission
                products: selectedItems.map(item => ({
                    product_id: item.product_id,
                    quantity: itemQuantities[item.product_id] || 1,
                }))
            };

            // Submit to backend
            const response = await apiService.createOrder(orderData, router);
            
            if (response.status === "success") {
                const createdOrder = response.data[0];
                
                // Generate invoice with the created order data
                const itemsData = selectedItems.map(item => ({
                    ...item,
                    quantity: itemQuantities[item.product_id] || 1
                }));

                const invoiceElement = document.createElement('div');
                invoiceElement.innerHTML = generateInvoiceHTML(
                    { ...createdOrder, order_number: createdOrder?.order_number }, 
                    selectedCustomer, 
                    itemsData,
                    additionalCosts
                );
                invoiceElement.style.width = '210mm';
                invoiceElement.style.minHeight = '297mm';
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
                
                // Generate PDF blob for email
                const pdfBlob = pdf.output('blob');
                
                // Save PDF locally
                pdf.save(`invoice_${selectedCustomer?.name || 'customer'}_${createdOrder?.order_number || 'order'}.pdf`);
                document.body.removeChild(invoiceElement);

                // Send invoice email to customer
                if (selectedCustomer?.email) {
                    await sendInvoiceEmail(createdOrder, selectedCustomer, pdfBlob);
                } else {
                    toast.error("Customer email not found - invoice not sent");
                }

                onSubmit(response.data);
                toast.success("Order created successfully!");
                setTimeout(() => {
                    onClose();
                }, 1000);
            } else {
                toast.error(response.message || "Failed to create order");
            }
        } catch (error) {
            console.error('Order creation error:', error);
            toast.error(error.message || "Failed to create order");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-[#b88b1b]">Create New Order - Step {currentStep}/3</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {loadingData ? (
                    <div className="flex justify-center items-center py-8">
                        <FontAwesomeIcon icon={faSpinner} spin className="text-[#b88b1b] text-xl" />
                        <span className="ml-2">Loading data...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {currentStep === 1 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700">Customer</label>
                                        <input
                                            type="text"
                                            value={customerQuery}
                                            onChange={handleCustomerChange}
                                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                            placeholder="Type to search customers by name..."
                                            required
                                        />
                                        {filteredCustomers.length > 0 && (
                                            <ul className="absolute z-10 border border-gray-300 mt-1 rounded-md max-h-40 overflow-y-auto bg-white w-full">
                                                {filteredCustomers.map((customer) => (
                                                    <li
                                                        key={customer.customer_id}
                                                        className="p-2 hover:bg-gray-100 cursor-pointer"
                                                        onClick={() => handleCustomerSelect(customer.customer_id)}
                                                    >
                                                        {customer.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Customer Email</label>
                                        <input
                                            type="email"
                                            value={selectedCustomer?.email || ''}
                                            readOnly
                                            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                                        />
                                    </div>
                                </div>

                                {/* ✅ BOTH EMAIL & PHONE NOW PREFILLED & READONLY */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                        <input
                                            type="text"
                                            value={formData.phone_number}
                                            readOnly  // ✅ CHANGED TO READONLY
                                            className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Dispatch Address</label>
                                    <textarea
                                        value={formData.dispatch_address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dispatch_address: e.target.value }))}
                                        className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
                                        <input
                                            type="date"
                                            value={formData.delivery_date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                        >
                                            <option value="unpaid">Unpaid</option>
                                            <option value="processing">Processing</option>
                                        </select>
                                    </div>
                                </div>

                                {status === 'processing' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                                            <select
                                                value={paymentType}
                                                onChange={(e) => setPaymentType(e.target.value)}
                                                className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                            >
                                                <option value="transfer">Transfer</option>
                                                <option value="cash">Cash</option>
                                                <option value="card">Card</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                        rows="2"
                                        placeholder="Additional notes..."
                                    />
                                </div>
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                {/* Search and Add Products Section */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Products</label>
                                    <div className="relative">
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                            placeholder="Search products by name or SKU..."
                                        />
                                    </div>
                                    
                                    {searchResults.length > 0 && (
                                        <div className="border border-gray-300 mt-1 rounded-md max-h-40 overflow-y-auto bg-white">
                                            {searchResults.map((product) => (
                                                <div
                                                    key={product.product_id}
                                                    className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                                                    onClick={() => handleItemSelect(product)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="font-medium">{product.name}</div>
                                                            <div className="text-sm text-gray-500">
                                                                SKU: {product.sku}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-semibold">
                                                            ₦{product.price?.toLocaleString() || 0}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Products List */}
                                {selectedItems.length > 0 && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Selected Products</label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedItems.map((product) => (
                                                <div key={product.product_id} className="flex items-center justify-between p-3 border border-gray-300 rounded-md">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{product.name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            SKU: {product.sku}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={itemQuantities[product.product_id] || 1}
                                                            onChange={(e) => handleQuantityChange(product.product_id, parseInt(e.target.value) || 1)}
                                                            className="w-20 p-1 border border-gray-300 rounded-md text-center"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(product.product_id)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Additional Costs */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Costs</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newCostName}
                                            onChange={(e) => setNewCostName(e.target.value)}
                                            className="p-2 border border-gray-300 rounded-md"
                                            placeholder="Cost name"
                                        />
                                        <input
                                            type="number"
                                            value={newCostPrice}
                                            onChange={(e) => setNewCostPrice(parseFloat(e.target.value) || 0)}
                                            className="p-2 border border-gray-300 rounded-md"
                                            placeholder="Price"
                                            min="0"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddAdditionalCost}
                                            className="p-2 bg-[#b88b1b] text-white rounded-md hover:bg-[#8b6a15] flex items-center justify-center"
                                        >
                                            <FontAwesomeIcon icon={faPlusCircle} className="mr-2" />
                                            Add
                                        </button>
                                    </div>
                                    {additionalCosts.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {additionalCosts.map((cost, index) => (
                                                <div key={index} className="flex justify-between items-center p-2 border border-gray-300 rounded-md">
                                                    <span>{cost.name}</span>
                                                    <span>₦{cost.price.toLocaleString()}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAdditionalCost(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FontAwesomeIcon icon={faTrash} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                                    <input
                                        type="text"
                                        value={`₦${formData.total_amount.toLocaleString()}`}
                                        readOnly
                                        className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100 font-bold"
                                    />
                                </div>
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                                    <input
                                        type="text"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                    <input
                                        type="text"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex justify-between space-x-2">
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                                    disabled={isLoading}
                                >
                                    Back
                                </button>
                            )}
                            {currentStep < 3 && (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(prev => prev + 1)}
                                    className="px-4 py-2 bg-[#b88b1b] hover:bg-[#8b6a15] transition-all text-white rounded-md disabled:opacity-50 flex items-center"
                                    disabled={isLoading || (currentStep === 1 && !formData.customer_id) || (currentStep === 2 && selectedItems.length === 0)}
                                >
                                    Next
                                </button>
                            )}
                            {currentStep === 3 && (
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#b88b1b] hover:bg-[#8b6a15] transition-all text-white rounded-md disabled:opacity-50 flex items-center"
                                    disabled={isLoading || !accountName || !accountNumber || !bankName}
                                >
                                    {isLoading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                            {sendingEmail ? "Sending Email..." : "Creating Order..."}
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                                            Create Order & Send Invoice
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateOrderModal;