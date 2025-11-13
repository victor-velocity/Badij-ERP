// components/sales/QRScannerModal.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";

export default function QRScannerModal({ order, onClose, onComplete }) {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false); // ← prevents double scan
  const scannerRef = useRef(null);
  const hasScanned = useRef(new Set());

  // Expected total items to scan
  const expectedQty = order.order_details?.reduce((sum, d) => sum + d.quantity, 0) || 0;
  const scannedCount = hasScanned.current.size;

  useEffect(() => {
    if (!scannerRef.current) return;

    const html5Scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        supportedScanTypes: [0],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    html5Scanner.render(
      async (decodedText) => {
        if (isScanning || hasScanned.current.has(decodedText)) {
          return; // ← block duplicate or in-progress scans
        }

        setIsScanning(true);
        toast.loading("Selling item...");

        try {
          await apiService.sellStockByBarcode(decodedText, order.order_id);
          hasScanned.current.add(decodedText);

          // Play success sound
          const audio = new Audio("/sounds/scan-success.mp3");
          audio.volume = 0.7;
          await audio.play().catch(() => {});

          toast.success("Item sold!");
        } catch (err) {
          toast.error(err.message || "Invalid QR");
        } finally {
          setIsScanning(false);
          toast.dismiss(); // clear loading
        }
      },
      (err) => console.warn("Scan error:", err)
    );

    setScanner(html5Scanner);
    scannerRef.current = html5Scanner;

    return () => {
      html5Scanner.clear();
      scannerRef.current = null;
    };
  }, [order.order_id]);

  const completeAndShip = async () => {
    if (scannedCount < expectedQty) {
      toast.error(`Scan all ${expectedQty} items first!`);
      return;
    }

    const loadingId = toast.loading("Shipping order...");
    try {
      await apiService.updateOrder(order.order_id, { status: "shipped" });
      toast.success("Order shipped!", { id: loadingId });
      onComplete();
    } catch (err) {
      toast.error("Failed to ship", { id: loadingId });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-2">Scan Items to Ship</h3>
        <p className="text-sm text-gray-600 mb-4">
          Order: <strong>{order.order_number}</strong>
        </p>

        {/* Progress */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg text-center">
          <p className="text-lg font-bold text-blue-800">
            {scannedCount} / {expectedQty} scanned
          </p>
          {scannedCount === expectedQty && (
            <p className="text-sm text-green-600 mt-1">All items ready!</p>
          )}
        </div>

        {/* Camera */}
        <div id="reader" className="w-full mb-4"></div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={completeAndShip}
            disabled={scannedCount < expectedQty}
            className="flex-1 py-2 bg-[#b88b1b] text-white rounded-lg hover:bg-[#9a7516] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Complete & Ship
          </button>
        </div>
      </div>
    </div>
  );
}