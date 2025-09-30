// CreateOrderModal.js
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const CreateOrderModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        customer_id: "",
        delivery_date: "",
        status: "pending",
        total_amount: 0,
        dispatch_address: "",
        phone_number: "",
        notes: "",
        products: []
    });
    const [customers, setCustomers] = useState([]);
    const [stockData, setStockData] = useState({ products: [], components: [] });
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerQuery, setCustomerQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemQuantities, setItemQuantities] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const router = useRouter();

    // Fetch customers and stock from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingData(true);
                const [customersResponse, stockResponse] = await Promise.all([
                    apiService.getCustomers(router),
                    apiService.getStocks(router)
                ]);

                if (customersResponse.status === "success") {
                    setCustomers(customersResponse.data || []);
                }

                if (stockResponse.status === "success") {
                    setStockData({
                        products: stockResponse.data?.products || [],
                        components: stockResponse.data?.components || []
                    });
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

    // Update total amount when items or quantities change
    useEffect(() => {
        const totalAmount = selectedItems.reduce((sum, item) => {
            const quantity = itemQuantities[item.id] || 1;
            const price = item.price || 0;
            return sum + price * quantity;
        }, 0);
        setFormData(prev => ({ ...prev, total_amount: totalAmount }));
    }, [selectedItems, itemQuantities]);

    // Search functionality for products and components
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSearchResults([]);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const allItems = [
            ...stockData.products.map(p => ({ ...p, type: 'product', id: p.product_id, price: p.price || 0 })),
            ...stockData.components.map(c => ({ ...c, type: 'component', id: c.component_id, price: c.price || 0 }))
        ];

        const filtered = allItems.filter(item =>
            item.name?.toLowerCase().includes(searchLower) ||
            item.sku?.toLowerCase().includes(searchLower)
        );

        setSearchResults(filtered);
    }, [searchTerm, stockData]);

    const handleCustomerChange = (e) => {
        const value = e.target.value;
        setCustomerQuery(value);
        if (value.trim() === "") {
            setSelectedCustomer(null);
            setFormData(prev => ({ ...prev, customer_id: "", phone_number: "", dispatch_address: "" }));
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
                phone_number: customer?.phone_number || '',
                dispatch_address: ''
            }));
            setCustomerQuery(customer.name);
            setFilteredCustomers([]);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleItemSelect = (item) => {
        // Check if item is already selected
        if (selectedItems.some(selected => selected.id === item.id && selected.type === item.type)) {
            toast.error("Item already added to order");
            return;
        }

        // Check stock availability
        if (item.stock_quantity < 1) {
            toast.error("Item is out of stock");
            return;
        }

        if (item.type === 'component') {
            toast.error("Components cannot be added directly to orders. Please select products.");
            return;
        }

        setSelectedItems(prev => [...prev, item]);
        setItemQuantities(prev => ({ ...prev, [item.id]: 1 }));
        setSearchTerm("");
        setSearchResults([]);
    };

    const handleQuantityChange = (itemId, quantity) => {
        const selectedItem = selectedItems.find(item => item.id === itemId);
        if (!selectedItem) return;

        const newQuantity = Math.max(1, quantity);
        if (newQuantity > selectedItem.stock_quantity) {
            toast.error("Quantity exceeds available stock");
            return;
        }

        setItemQuantities(prev => ({ 
            ...prev, 
            [itemId]: newQuantity 
        }));
    };

    const handleRemoveItem = (itemId) => {
        setSelectedItems(prev => prev.filter(item => item.id !== itemId));
        setItemQuantities(prev => {
            const newQuantities = { ...prev };
            delete newQuantities[itemId];
            return newQuantities;
        });
    };

    const generateInvoiceHTML = (orderData, customerData, itemsData) => {
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
                        <p style="margin: 5px 0; font-weight: bold;">${customerData?.name || 'N/A'}</p>
                        <p style="margin: 5px 0;">${orderData.dispatch_address}</p>
                        <p style="margin: 5px 0;">Phone: ${orderData.phone_number}</p>
                        <p style="margin: 5px 0;">Email: ${customerData?.email || 'N/A'}</p>
                    </div>
                </div>

                <div style="flex: 1; min-width: 250px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>Invoice Details:</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px;">
                        <p style="margin: 5px 0;"><strong>Order No:</strong> ${orderData.order_number}</p>
                        <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${orderData.delivery_date || 'Not set'}</p>
                        <p style="margin: 5px 0;"><strong>Status:</strong> ${orderData.status}</p>
                    </div>
                </div>

                <div style="flex: 1; min-width: 200px;">
                    <div style="background: #b88b1b; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0; text-align: center;">
                        <strong>TOTAL DUE</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; text-align: center;">
                        <p style="font-size: 24px; font-weight: bold; color: #b88b1b; margin: 0;">₦${orderData.total_amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                    <thead>
                        <tr style="background: #b88b1b; color: white;">
                            <th style="padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;">Item Description</th>
                            <th style="padding: 12px; text-align: center; border: 1px solid #ddd; font-weight: bold; width: 100px;">Type</th>
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
                                    <br>
                                    <small style="color: #666;">SKU: ${item.sku}</small>
                                </td>
                                <td style="padding: 12px; border: 1px solid #ddd; text-align: center; vertical-align: top; text-transform: capitalize;">
                                    ${item.type}
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
                            <span>₦${orderData.total_amount.toLocaleString()}</span>
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
        
        if (selectedItems.length === 0) {
            toast.error("Please select at least one item");
            return;
        }

        if (!formData.customer_id) {
            toast.error("Please select a customer");
            return;
        }

        // Additional check for stock quantities
        const insufficientStock = selectedItems.some(item => {
            const qty = itemQuantities[item.id] || 1;
            return qty > item.stock_quantity;
        });

        if (insufficientStock) {
            toast.error("One or more items exceed available stock");
            return;
        }

        setIsLoading(true);
        try {
            // Prepare data for backend
            const orderData = {
                customer_id: formData.customer_id,
                delivery_date: formData.delivery_date || null,
                status: "pending",
                total_amount: formData.total_amount,
                dispatch_address: formData.dispatch_address,
                phone_number: formData.phone_number,
                notes: formData.notes || "",
                products: selectedItems.map(item => ({
                    product_id: item.id,
                    quantity: itemQuantities[item.id] || 1,
                }))
            };

            // Submit to backend
            const response = await apiService.createOrder(orderData, router);
            
            if (response.status === "success") {
                // Generate invoice with the created order data
                const itemsData = selectedItems.map(item => ({
                    ...item,
                    quantity: itemQuantities[item.id] || 1
                }));

                const invoiceElement = document.createElement('div');
                invoiceElement.innerHTML = generateInvoiceHTML(
                    { ...response.data[0], order_number: response.data[0]?.order_number }, 
                    selectedCustomer, 
                    itemsData
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
                pdf.save(`invoice_${selectedCustomer?.name || 'customer'}_${response.data[0]?.order_number || 'order'}.pdf`);
                document.body.removeChild(invoiceElement);

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
                    <h2 className="text-lg font-bold text-[#b88b1b]">Create New Order</h2>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                    required
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
                                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                                <input
                                    type="text"
                                    value={`₦${formData.total_amount.toLocaleString()}`}
                                    readOnly
                                    className="mt-1 p-2 w-full border border-gray-300 rounded-md bg-gray-100 font-bold"
                                />
                            </div>
                        </div>

                        {/* Search and Add Items Section */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Add Items</label>
                            <div className="relative">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#b88b1b]"
                                    placeholder="Search products or components by name or SKU..."
                                />
                            </div>
                            
                            {searchResults.length > 0 && (
                                <div className="border border-gray-300 mt-1 rounded-md max-h-40 overflow-y-auto bg-white">
                                    {searchResults.map((item) => (
                                        <div
                                            key={`${item.type}-${item.id}`}
                                            className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                                            onClick={() => handleItemSelect(item)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        SKU: {item.sku} • Type: {item.type} • Stock: {item.stock_quantity}
                                                    </div>
                                                </div>
                                                <div className="text-sm font-semibold">
                                                    ₦{item.price?.toLocaleString() || 0}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Items List */}
                        {selectedItems.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Items</label>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {selectedItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 border border-gray-300 rounded-md">
                                            <div className="flex-1">
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    SKU: {item.sku} • Type: {item.type}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={itemQuantities[item.id] || 1}
                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                                    className="w-20 p-1 border border-gray-300 rounded-md text-center"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(item.id)}
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

                        <div className="flex justify-end space-x-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#b88b1b] hover:bg-[#8b6a15] transition-all text-white rounded-md disabled:opacity-50"
                                disabled={isLoading || selectedItems.length === 0}
                            >
                                {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : "Create Order"}
                            </button>
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