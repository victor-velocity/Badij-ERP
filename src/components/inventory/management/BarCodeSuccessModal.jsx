// ./BarCodeSuccessModal.jsx
import React from 'react';
import toast from 'react-hot-toast';

const BarcodeSuccessModal = ({
    isOpen,
    onClose,
    barcodes,
    pdfData,
    itemName,
    batchId,
    boxesCount,
    quantityInBox = 1,
}) => {
    if (!isOpen) return null;

    const downloadPDF = () => {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${pdfData.data}`;
        link.download = pdfData.filename;
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-[#000000aa] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header with Green Check */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 relative">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">
                            Stock Added Successfully!
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {/* Green Check */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div className="text-center">
                        <p className="text-lg font-semibold">{itemName}</p>
                        <p className="text-sm text-gray-600">Batch: {batchId}</p>
                        <p className="text-sm text-gray-600">
                            Boxes: {boxesCount} • Qty per Box: <strong>{quantityInBox}</strong>
                        </p>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Barcodes Generated:</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                            {barcodes.map((b, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <code className="text-xs font-mono">{b}</code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(b);
                                            toast.success('Copied!');
                                        }}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm font-medium text-amber-800">
                            PDF is password-protected: <strong>madison123</strong>
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={downloadPDF}
                            className="flex items-center gap-2 px-6 py-3 bg-[#153087] text-white rounded-xl font-medium hover:bg-[#9a7516] transition-all shadow-sm hover:shadow-md"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF Labels
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeSuccessModal;