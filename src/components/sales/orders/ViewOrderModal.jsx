import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faCalendar, faUser, faPhone, faMapMarkerAlt, faStickyNote, faBox, faReceipt, faPrint } from '@fortawesome/free-solid-svg-icons';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const ViewOrderModal = ({ isOpen, onClose, order, customer, createdById }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [formattedOrder, setFormattedOrder] = useState(null);
    const [createdByName, setCreatedByName] = useState('Loading...');
    const router = useRouter();

    useEffect(() => {
        const fetchEmployee = async () => {
            if (createdById) {
                try {
                    const response = await apiService.getEmployeeById(createdById, router);
                    const data = response.data || response;
                    setCreatedByName(`${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown Employee');
                } catch (error) {
                    console.error(`Error fetching employee ${createdById}:`, error);
                    setCreatedByName('Unknown Employee');
                }
            } else {
                setCreatedByName('Unknown Employee');
            }
        };

        fetchEmployee();
    }, [createdById, router]);

    useEffect(() => {
        if (order) {
            const items = order.order_details?.map(detail => ({
                name: detail.product_id?.name || 'Unknown Product',
                price: detail.product_id?.price || 0,
                quantity: detail.quantity || 0,
                total: (detail.product_id?.price || 0) * (detail.quantity || 0)
            })) || [];

            const subtotal = items.reduce((sum, item) => sum + item.total, 0);

            const formatted = {
                order_number: order.order_number,
                customer: customer?.name || 'Unknown Customer',
                address: order.dispatch_address || 'Not specified',
                deliveryDate: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set',
                status: order.status,
                phone: customer?.phone || order.phone_number || 'Not provided',
                email: customer?.email || 'Not provided',
                items: items,
                subtotal: subtotal,
                additional_costs: order.additional_costs || 0,
                total_amount: order.total_amount,
                notes: order.notes,
                created_at: order.created_at ? new Date(order.created_at).toLocaleString() : 'Unknown',
                updated_at: order.updated_at ? new Date(order.updated_at).toLocaleString() : 'Unknown',
                created_by: createdByName
            };
            setFormattedOrder(formatted);
            setIsLoading(false);
        }
    }, [order, customer, createdByName]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'processing':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'shipped':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'canceled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'unpaid':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return '⏳';
            case 'processing':
                return '📦';
            case 'shipped':
                return '🚚';
            case 'delivered':
                return '✅';
            case 'canceled':
                return '❌';
            case 'unpaid':
                return '💰';
            default:
                return '📋';
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('printable-order-content');
        const originalContents = document.body.innerHTML;
        
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload();
    };

    if (!isOpen) return null;

    if (isLoading) return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="flex justify-center items-center">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-[#b88b1b]" />
                    <span className="ml-3 text-gray-600">Loading order details...</span>
                </div>
            </div>
        </div>
    );

    if (!formattedOrder) return (
        <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Order details not found</p>
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-[#8b6a15] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Printable Content (Hidden on screen) */}
            <div id="printable-order-content" className="hidden">
                <div className="print-container p-8 bg-white">
                    {/* Print Header */}
                    <div className="print-header border-b-2 border-gray-800 pb-4 mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">ORDER DETAILS</h1>
                        <div className="flex justify-between items-center mt-2">
                            <div>
                                <p className="text-lg font-semibold">Order #: {formattedOrder.order_number}</p>
                                <div className="text-gray-600">Date: {formattedOrder.created_at}</div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold">STATUS: {formattedOrder.status?.toUpperCase()}</p>
                                <p className="text-2xl font-bold text-[#b88b1b]">
                                    TOTAL: ₦{formattedOrder.total_amount?.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
                    <div className="print-section mb-6">
                        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">CUSTOMER INFORMATION</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p><strong>Customer Name:</strong> {formattedOrder.customer}</p>
                            </div>
                            <div>
                                <p><strong>Phone:</strong> {formattedOrder.phone}</p>
                            </div>
                            <div>
                                <p><strong>Email:</strong> {formattedOrder.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Delivery Information */}
                    <div className="print-section mb-6">
                        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">DELIVERY INFORMATION</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p><strong>Dispatch Address:</strong> {formattedOrder.address}</p>
                            </div>
                            <div>
                                <p><strong>Delivery Date:</strong> {formattedOrder.deliveryDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="print-section mb-6">
                        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">ORDER ITEMS</h2>
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-3 text-left font-bold">Product Name</th>
                                    <th className="border border-gray-300 p-3 text-right font-bold">Unit Price</th>
                                    <th className="border border-gray-300 p-3 text-right font-bold">Quantity</th>
                                    <th className="border border-gray-300 p-3 text-right font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formattedOrder.items.map((item, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                        <td className="border border-gray-300 p-3">{item.name}</td>
                                        <td className="border border-gray-300 p-3 text-right">₦{item.price?.toLocaleString()}</td>
                                        <td className="border border-gray-300 p-3 text-right">{item.quantity}</td>
                                        <td className="border border-gray-300 p-3 text-right font-bold">
                                            ₦{item.total.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="border border-gray-300 p-3 text-right font-bold">
                                        Subtotal:
                                    </td>
                                    <td className="border border-gray-300 p-3 text-right font-bold">
                                        ₦{formattedOrder.subtotal.toLocaleString()}
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="border border-gray-300 p-3 text-right font-bold">
                                        Additional Costs:
                                    </td>
                                    <td className="border border-gray-300 p-3 text-right font-bold">
                                        ₦{formattedOrder.additional_costs.toLocaleString()}
                                    </td>
                                </tr>
                                <tr className="bg-gray-800 text-white">
                                    <td colSpan="3" className="border border-gray-300 p-3 text-right font-bold">
                                        GRAND TOTAL:
                                    </td>
                                    <td className="border border-gray-300 p-3 text-right font-bold text-lg">
                                        ₦{formattedOrder.total_amount?.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Additional Information */}
                    <div className="print-section">
                        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-3">ADDITIONAL INFORMATION</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p><strong>Notes:</strong> {formattedOrder.notes || 'No notes provided'}</p>
                            </div>
                            <div>
                                <p><strong>Created By:</strong> {formattedOrder.created_by}</p>
                            </div>
                            <div>
                                <p><strong>Last Updated:</strong> {formattedOrder.updated_at}</p>
                            </div>
                        </div>
                    </div>

                    {/* Print Footer */}
                    <div className="print-footer mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
                        <p>Generated on {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Main Modal */}
            <div className="fixed inset-0 bg-[#000000aa] bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#b88b1b] to-[#d4af37] p-6 rounded-t-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Order Details</h2>
                                <p className="text-white/90 mt-1">Order #{formattedOrder.order_number}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
                            >
                                <FontAwesomeIcon icon={faTimes} size="lg" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Order Status & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-1 ${getStatusColor(formattedOrder.status)}`}>
                                            <span className="mr-2">{getStatusIcon(formattedOrder.status)}</span>
                                            {formattedOrder.status?.charAt(0).toUpperCase() + formattedOrder.status?.slice(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <p className="text-sm text-gray-600">Total Amount</p>
                                <p className="text-2xl font-bold text-[#b88b1b] mt-1">
                                    ₦{formattedOrder.total_amount?.toLocaleString() || '0.00'}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <p className="text-sm text-gray-600">Order Date</p>
                                <p className="text-lg font-semibold text-gray-800 mt-1">
                                    {formattedOrder.created_at}
                                </p>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faUser} className="text-[#b88b1b] mr-2" />
                                Customer Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Customer Name</p>
                                    <p className="font-medium">{formattedOrder.customer}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Phone Number</p>
                                    <p className="font-medium flex items-center">
                                        <FontAwesomeIcon icon={faPhone} className="text-gray-400 mr-2 text-sm" />
                                        {formattedOrder.phone}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium">{formattedOrder.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                <FontAwesomeIcon icon={faBox} className="text-[#b88b1b] mr-2" />
                                Order Items ({formattedOrder.items.length})
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Product</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Price</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Quantity</th>
                                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formattedOrder.items.map((item, index) => (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <p className="font-medium text-gray-800">{item.name}</p>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <p className="font-medium">₦{item.price?.toLocaleString()}</p>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <p className="font-medium">{item.quantity}</p>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <p className="font-bold text-[#b88b1b]">
                                                        ₦{item.total.toLocaleString()}
                                                    </p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3" className="py-3 px-4 text-right font-semibold text-gray-800">
                                                Subtotal:
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold">
                                                ₦{formattedOrder.subtotal.toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="py-3 px-4 text-right font-semibold text-gray-800">
                                                Additional Costs:
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold">
                                                ₦{formattedOrder.additional_costs.toLocaleString()}
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td colSpan="3" className="py-3 px-4 text-right font-semibold text-gray-800">
                                                Grand Total:
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <p className="text-xl font-bold text-[#b88b1b]">
                                                    ₦{formattedOrder.total_amount?.toLocaleString()}
                                                </p>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[#b88b1b] mr-2" />
                                    Delivery Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Dispatch Address</p>
                                        <p className="font-medium">{formattedOrder.address}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Delivery Date</p>
                                        <p className="font-medium flex items-center">
                                            <FontAwesomeIcon icon={faCalendar} className="text-gray-400 mr-2 text-sm" />
                                            {formattedOrder.deliveryDate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <FontAwesomeIcon icon={faStickyNote} className="text-[#b88b1b] mr-2" />
                                    Additional Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Notes</p>
                                        <p className="font-medium">
                                            {formattedOrder.notes || 'No notes provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Created By</p>
                                        <p className="font-medium">{formattedOrder.created_by}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Last Updated</p>
                                        <p className="font-medium">{formattedOrder.updated_at}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-6 py-2 bg-[#b88b1b] text-white rounded-md hover:bg-[#8b6a15] transition-colors flex items-center"
                            >
                                <FontAwesomeIcon icon={faPrint} className="mr-2" />
                                Print Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-container,
                    .print-container * {
                        visibility: visible;
                    }
                    .print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        max-width: 100%;
                        padding: 20px;
                        background: white;
                    }
                    .print-section {
                        page-break-inside: avoid;
                        margin-bottom: 20px;
                    }
                    .print-header {
                        page-break-before: always;
                    }
                    .print-footer {
                        page-break-after: always;
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    thead {
                        display: table-header-group;
                    }
                    tfoot {
                        display: table-footer-group;
                    }
                    .bg-gray-50 {
                        background-color: #f9fafb !important;
                    }
                    .bg-gray-100 {
                        background-color: #f3f4f6 !important;
                    }
                    .bg-gray-800 {
                        background-color: #1f2937 !important;
                        color: white !important;
                    }
                    .text-[#b88b1b] {
                        color: #b88b1b !important;
                    }
                }
            `}</style>
        </>
    );
};

export default ViewOrderModal;