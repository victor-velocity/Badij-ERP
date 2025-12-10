// CreateOrderModal.js
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faSearch, faTrash, faEnvelope, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import { PDFDocument } from "pdf-lib";

const CreateOrderModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        customer_id: "",
        delivery_date: "",
        dispatch_address: "",
        phone_number: "",
        notes: "",
        products: []
    });

    const [deliveryStatus, setDeliveryStatus] = useState("pending");
    const [paymentStatus, setPaymentStatus] = useState("unpaid");
    const [applyVat, setApplyVat] = useState(false);
    const [applyDiscount, setApplyDiscount] = useState(false);
    const VAT_RATE = 7.5;
    const DISCOUNT_RATE = 2.0;

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerQuery, setCustomerQuery] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemQuantities, setItemQuantities] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [additionalCosts, setAdditionalCosts] = useState([]);
    const [newCostName, setNewCostName] = useState("");
    const [newCostPrice, setNewCostPrice] = useState(0);
    const [loadingData, setLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [accountName] = useState("Badij Technologies Ltd");
    const [accountNumber] = useState("0712627429");
    const [bankName] = useState("Access Bank");
    const router = useRouter();

    // Fetch data
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                setLoadingData(true);
                const [custRes, prodRes] = await Promise.all([
                    apiService.getCustomers(router),
                    apiService.getProducts(router)
                ]);
                if (custRes.status === "success") setCustomers(custRes.data || []);
                if (prodRes.status === "success") setProducts(prodRes.data || []);
            } catch (err) {
                toast.error("Failed to load data");
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [isOpen, router]);

    // Calculate totals
    const subtotal = selectedItems.reduce((sum, item) => {
        const qty = itemQuantities[item.product_id] || 1;
        return sum + (item.price || 0) * qty;
    }, 0);

    const additionalTotal = additionalCosts.reduce((sum, c) => sum + c.price, 0);
    const baseTotal = subtotal + additionalTotal;
    const discountAmount = applyDiscount ? (baseTotal * DISCOUNT_RATE) / 100 : 0;
    const vatAmount = applyVat ? (baseTotal - discountAmount) * (VAT_RATE / 100) : 0;
    const finalTotal = baseTotal - discountAmount + vatAmount;

    // Customer search
    useEffect(() => {
        if (!customerQuery.trim()) {
            setFilteredCustomers([]);
            return;
        }
        const filtered = customers.filter(c =>
            c.name?.toLowerCase().includes(customerQuery.toLowerCase())
        );
        setFilteredCustomers(filtered);
    }, [customerQuery, customers]);

    const handleCustomerSelect = (cust) => {
        setSelectedCustomer(cust);
        setFormData(prev => ({
            ...prev,
            customer_id: cust.customer_id,
            phone_number: cust.phone || ""
        }));
        setCustomerQuery(cust.name);
        setFilteredCustomers([]);
    };

    // Product search
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        const filtered = products.filter(p =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(filtered);
    }, [searchTerm, products]);

    const addProduct = (product) => {
        if (selectedItems.find(i => i.product_id === product.product_id)) {
            toast.error("Product already added");
            return;
        }
        setSelectedItems(prev => [...prev, product]);
        setItemQuantities(prev => ({ ...prev, [product.product_id]: 1 }));
        setSearchTerm("");
        setSearchResults([]);
    };

    const removeProduct = (id) => {
        setSelectedItems(prev => prev.filter(p => p.product_id !== id));
        setItemQuantities(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
    };

    const addAdditionalCost = () => {
        if (!newCostName.trim() || newCostPrice <= 0) {
            toast.error("Enter valid cost name and amount");
            return;
        }
        setAdditionalCosts(prev => [...prev, { name: newCostName, price: newCostPrice }]);
        setNewCostName("");
        setNewCostPrice(0);
    };

    // PDF Invoice Generation
    const generateInvoiceHTML = (orderData, customerData, itemsData, additionalCosts) => {
        const additionalHtml = additionalCosts.map(cost => `
            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span>${cost.name}:</span>
                <span>₦${cost.price.toLocaleString()}</span>
            </div>
        `).join('');

        return `
        <div style="font-family: Arial, sans-serif; padding: 30px; background: white; color: #333; max-width: 100%;">
            <div style="display: flex; justify-content: center; margin-bottom: 30px; border-bottom: 3px solid #153087; padding-bottom: 20px;">
                <img src="/badij_logo.png" alt="Company Logo" style="max-height: 60px; width: auto;" />
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #153087; font-size: 28px; margin: 0; border: 2px solid #153087; display: inline-block; padding: 10px 30px; border-radius: 5px;">
                    INVOICE
                </h2>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 250px; min-height: 180px;">
                    <div style="background: #153087; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
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
                    <div style="background: #153087; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>Invoice Details:</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; height: calc(100% - 42px);">
                        <p style="margin: 5px 0;"><strong>Order No:</strong> ${orderData.order_number}</p>
                        <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${orderData.delivery_date || 'Not set'}</p>
                        <p style="margin: 5px 0;"><strong>Delivery Status:</strong> ${orderData.delivery_status}</p>
                        <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${orderData.payment_status}</p>
                    </div>
                </div>
                <div style="flex: 1; min-width: 200px; min-height: 180px;">
                    <div style="background: #153087; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0; text-align: center;">
                        <strong>TOTAL DUE</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; text-align: center; height: calc(100% - 42px); display: flex; align-items: center; justify-content: center;">
                        <p style="font-size: 24px; font-weight: bold; color: #153087; margin: 0;">₦${orderData.total_amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div style="margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                    <thead>
                        <tr style="background: #153087; color: white;">
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
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 300px; min-height: 200px;">
                    <div style="background: #153087; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0;">
                        <strong>PAYMENT INFORMATION</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; height: calc(100% - 42px);">
                        <p style="margin: 5px 0;"><strong>Account Name:</strong> ${accountName}</p>
                        <p style="margin: 5px 0;"><strong>Account Number:</strong> ${accountNumber}</p>
                        <p style="margin: 5px 0;"><strong>Bank:</strong> ${bankName}</p>
                        <p style="margin: 5px 0; color: #666;">${orderData.notes || 'No additional notes provided.'}</p>
                    </div>
                </div>
                <div style="flex: 1; min-width: 250px; min-height: 200px;">
                    <div style="background: #153087; color: white; padding: 10px 15px; border-radius: 5px 5px 0 0; text-align: center;">
                        <strong>ORDER SUMMARY</strong>
                    </div>
                    <div style="border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 5px 5px; height: calc(100% - 42px);">
                        <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                            <span>Subtotal:</span>
                            <span>₦${baseTotal.toLocaleString()}</span>
                        </div>
                        ${applyDiscount ? `
                            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                                <span>Discount (2%):</span>
                                <span>-₦${discountAmount.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        ${applyVat ? `
                            <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                                <span>VAT (7.5%):</span>
                                <span>₦${vatAmount.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        ${additionalHtml}
                        <hr style="border: none; border-top: 2px solid #153087; margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 18px; font-weight: bold;">
                            <span>GRAND TOTAL:</span>
                            <span style="color: #153087;">₦${orderData.total_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div style="border-top: 3px solid #153087; padding-top: 20px; margin-top: 30px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <p style="font-size: 18px; font-weight: bold; color: #153087; margin: 0;">Thank you for your patronage!</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 2; min-width: 300px;">
                        <p style="margin: 5px 0; font-weight: bold;">TERMS & CONDITIONS:</p>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">All orders are subject to availability. Delivery times are estimates and may vary.
                        </p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 5px;">
                    <p style="margin: 5px 0; font-weight: bold; color: #153087;">Badij Technologies LIMITED</p>
                    <p style="margin: 3px 0; font-size: 12px;">13, Alhaij Kanike Close, off Awolowo Road, Ikoyi - Lagos</p>
                    <p style="margin: 3px 0; font-size: 12px;">Phone: +234-816-254-7995 | Email: sales@madisonjayng.com</p>
                    <p style="margin: 3px 0; font-size: 12px;">Website: www.madisonjayng.com</p>
                </div>
            </div>
        </div>
        `;
    };

    const compressPdf = async (blob) => {
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const compressedBytes = await pdfDoc.save({ useObjectStreams: false, addDefaultPage: false });
            return new Blob([compressedBytes], { type: 'application/pdf' });
        } catch (error) {
            console.warn('PDF compression failed, using original:', error);
            return blob;
        }
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
                toast.success("Invoice sent to customer!");
                return true;
            } else {
                toast.error("Failed to send invoice email");
                return false;
            }
        } catch (error) {
            toast.error("Failed to send invoice email");
            return false;
        } finally {
            setSendingEmail(false);
        }
    };

    const submitOrder = async (e) => {
        e.preventDefault();
        if (!selectedCustomer) return toast.error("Select a customer");
        if (selectedItems.length === 0) return toast.error("Add at least one product");

        setIsSubmitting(true);

        const payload = {
            customer_id: selectedCustomer.customer_id,
            delivery_date: formData.delivery_date || null,
            delivery_status: deliveryStatus,
            payment_status: paymentStatus,
            total_amount: finalTotal,
            dispatch_address: formData.dispatch_address,
            phone_number: formData.phone_number,
            notes: formData.notes || "",
            additional_costs: additionalTotal,
            apply_vat: applyVat,
            apply_discount: applyDiscount,
            vat_percentage: applyVat ? VAT_RATE : 0,
            discount_percentage: applyDiscount ? DISCOUNT_RATE : 0,
            products: selectedItems.map(item => ({
                product_id: item.product_id,
                quantity: itemQuantities[item.product_id] || 1
            }))
        };

        try {
            const res = await apiService.createOrder(payload, router);
            if (res.status === "success") {
                const createdOrder = res.data[0];

                // Generate PDF
                const itemsData = selectedItems.map(item => ({
                    ...item,
                    quantity: itemQuantities[item.product_id] || 1
                }));

                const invoiceElement = document.createElement('div');
                invoiceElement.innerHTML = generateInvoiceHTML(
                    { ...createdOrder, order_number: createdOrder.order_number, total_amount: finalTotal, delivery_status: deliveryStatus, payment_status: paymentStatus },
                    selectedCustomer,
                    itemsData,
                    additionalCosts
                );
                invoiceElement.style.width = '210mm';
                invoiceElement.style.minHeight = '297mm';
                document.body.appendChild(invoiceElement);

                const canvas = await html2canvas(invoiceElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false
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

                const rawBlob = pdf.output('blob');
                const pdfBlob = await compressPdf(rawBlob);

                pdf.save(`invoice_${selectedCustomer?.name || 'customer'}_${createdOrder.order_number}.pdf`);
                document.body.removeChild(invoiceElement);

                // Send email
                if (selectedCustomer?.email) {
                    await sendInvoiceEmail(
                        { ...createdOrder, order_number: createdOrder.order_number, total_amount: finalTotal },
                        selectedCustomer,
                        pdfBlob
                    );
                }

                toast.success("Order created successfully!");
                onSubmit(res.data);
                onClose();
            } else {
                toast.error(res.message || "Failed to create order");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-[#153087]">Create Order - Step {currentStep}/2</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={submitOrder} className="p-6">
                    {loadingData ? (
                        <div className="text-center py-12">
                            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#153087]" />
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Customer & Details */}
                            {currentStep === 1 && (
                                <div className="space-y-5">
                                    <div className="relative">
                                        <label className="block font-semibold mb-1">Customer</label>
                                        <input
                                            type="text"
                                            value={customerQuery}
                                            onChange={(e) => setCustomerQuery(e.target.value)}
                                            placeholder="Search customer..."
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                        />
                                        {filteredCustomers.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredCustomers.map(c => (
                                                    <div
                                                        key={c.customer_id}
                                                        onClick={() => handleCustomerSelect(c)}
                                                        className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-300"
                                                    >
                                                        <div className="font-medium">{c.name}</div>
                                                        <div className="text-sm text-gray-600">{c.email}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {selectedCustomer && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold">Email</label>
                                                <input value={selectedCustomer.email || ""} readOnly className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none" />
                                            </div>
                                            <div>
                                                <label className="block font-semibold">Phone</label>
                                                <input value={selectedCustomer.phone || ""} readOnly className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none" />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block font-semibold">Dispatch Address</label>
                                        <textarea
                                            required
                                            rows={3}
                                            value={formData.dispatch_address}
                                            onChange={e => setFormData(prev => ({ ...prev, dispatch_address: e.target.value }))}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold">Delivery Date</label>
                                            <input
                                                type="date"
                                                value={formData.delivery_date}
                                                onChange={e => setFormData(prev => ({ ...prev, delivery_date: e.target.value }))}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold">Delivery Status</label>
                                            <select
                                                value={deliveryStatus}
                                                onChange={e => setDeliveryStatus(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold mb-2">Payment Status</label>
                                        <div className="flex gap-6">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="payment_status"
                                                    value="unpaid"
                                                    checked={paymentStatus === "unpaid"}
                                                    onChange={e => setPaymentStatus(e.target.value)}
                                                    className="mr-2"
                                                />
                                                <span>Unpaid</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="payment_status"
                                                    value="paid"
                                                    checked={paymentStatus === "paid"}
                                                    onChange={e => setPaymentStatus(e.target.value)}
                                                    className="mr-2"
                                                />
                                                <span>Paid</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex gap-6">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={applyVat}
                                                onChange={e => setApplyVat(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span>Apply VAT (7.5%)</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={applyDiscount}
                                                onChange={e => setApplyDiscount(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span>Apply Discount (2%)</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block font-semibold">Notes (Optional)</label>
                                        <textarea
                                            rows={3}
                                            value={formData.notes}
                                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Products & Costs */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                <div>
                                    <label className="block font-semibold mb-2">Search Products</label>
                                    <div className="relative">
                                        <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder="Name or SKU..."
                                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                        />
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="mt-2 border border-gray-300 rounded-lg max-h-64 overflow-y-auto bg-white shadow">
                                            {searchResults.map(p => (
                                                <div
                                                    key={p.product_id}
                                                    onClick={() => addProduct(p)}
                                                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-300 flex justify-between"
                                                >
                                                    <div>
                                                        <div className="font-medium">{p.name}</div>
                                                        <div className="text-sm text-gray-500">SKU: {p.sku}</div>
                                                    </div>
                                                    <div className="font-bold">₦{p.price?.toLocaleString()}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedItems.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-3">Selected Items</h3>
                                        <div className="space-y-3">
                                            {selectedItems.map(item => (
                                                <div key={item.product_id} className="flex items-center justify-between p-4 border rounded-lg border-gray-300">
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="text-sm text-gray-500">₦{item.price?.toLocaleString()} each</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={itemQuantities[item.product_id] || 1}
                                                            onChange={e => setItemQuantities(prev => ({
                                                                ...prev,
                                                                [item.product_id]: parseInt(e.target.value) || 1
                                                            }))}
                                                            className="w-20 p-2 border border-gray-400 rounded text-center"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProduct(item.product_id)}
                                                            className="text-red-600 hover:text-red-800"
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
                                <div>
                                    <h3 className="font-semibold mb-2">Additional Costs</h3>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <input
                                            type="text"
                                            value={newCostName}
                                            onChange={e => setNewCostName(e.target.value)}
                                            placeholder="e.g. Delivery Fee"
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                        />
                                        <input
                                            type="number"
                                            value={newCostPrice}
                                            onChange={e => setNewCostPrice(parseFloat(e.target.value) || 0)}
                                            placeholder="Amount"
                                            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#153087] outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={addAdditionalCost}
                                            className="bg-[#153087] text-white rounded-2xl transition-all hover:bg-[#8b6a15] flex items-center justify-center gap-2"
                                        >
                                            <FontAwesomeIcon icon={faPlusCircle} /> Add
                                        </button>
                                    </div>
                                    {additionalCosts.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 border rounded mb-2">
                                            <span>{c.name}</span>
                                            <span className="font-medium">₦{c.price.toLocaleString()}</span>
                                            <button type="button" onClick={() => setAdditionalCosts(prev => prev.filter((_, idx) => idx !== i))} className="text-red-600">
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Summary */}
                                <div className="bg-gray-50 p-5 rounded-lg text-lg font-semibold space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>₦{baseTotal.toLocaleString()}</span>
                                    </div>
                                    {applyDiscount && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount (2%):</span>
                                            <span>-₦{discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {applyVat && (
                                        <div className="flex justify-between text-blue-600">
                                            <span>VAT (7.5%):</span>
                                            <span>+₦{vatAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-bold text-[#153087] border-t pt-3">
                                        <span>Grand Total:</span>
                                        <span>₦{finalTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between mt-8">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100"
                                    >
                                        Back
                                    </button>
                                )}
                                {currentStep < 2 ? (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep(2)}
                                        disabled={!selectedCustomer || !formData.dispatch_address}
                                        className="px-8 py-3 bg-[#153087] text-white rounded-lg hover:bg-[#8b6a15] disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || selectedItems.length === 0}
                                        className="px-8 py-3 bg-[#153087] text-white rounded-lg hover:bg-[#8b6a15] disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting || sendingEmail ? (
                                            <>
                                                <FontAwesomeIcon icon={faSpinner} spin />
                                                {sendingEmail ? "Sending Email..." : "Creating..."}
                                            </>
                                        ) : (
                                            <>
                                                <FontAwesomeIcon icon={faEnvelope} />
                                                Create & Send Invoice
                                            </>
                                        )}
                                    </button>
                                )}
                                <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100">
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default CreateOrderModal;