"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";
import apiService from "@/app/lib/apiService";

export default function QRScannerModal({ order, onClose, onComplete }) {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [itemsToScan, setItemsToScan] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const scannerRef = useRef(null);

  // Map: product_name → required quantity
  const orderQtyMap = useRef({});

  // Build map: product_name → total required quantity
  useEffect(() => {
    if (!order?.order_details) return;

    const map = {};
    order.order_details.forEach((d) => {
      const name = d.product_id?.name;
      if (name) {
        map[name] = (map[name] || 0) + d.quantity;
      }
    });

    orderQtyMap.current = map;
    console.log("Order quantity map (by name):", map);
  }, [order?.order_details]);

  // Initialize scanner
  useEffect(() => {
    if (scannerRef.current) return;

    const html5Scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [0],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        aspectRatio: 1,
      },
      false
    );

    const onScanSuccess = async (decodedText) => {
      if (isScanning || itemsToScan.some((i) => i.barcode === decodedText)) {
        return;
      }

      setIsScanning(true);
      toast.loading("Validating QR code...");

      const playBeep = () => {
        const audio = new Audio("/sounds/qr-beep.mp3");
        audio.volume = 0.9;
        audio.play().catch((e) => console.log("Audio play failed (user interaction required):", e));
      };

      try {
        const boxRes = await apiService.getBoxByBarcode(decodedText);
        if (!boxRes?.data) throw new Error("Box not found");

        const box = boxRes.data;
        const boxId = box.box_id;
        const productName = box.boxes?.product_name || "Unknown Product";
        const quantityInBox = box.boxes?.quantity_in_box || 1;

        if (!productName || productName === "Unknown Product") {
          throw new Error("Invalid product in box");
        }

        const expectedQty = orderQtyMap.current[productName];
        if (expectedQty === undefined) {
          throw new Error("This product is not part of this order");
        }

        const alreadyScannedUnits = itemsToScan
          .filter((i) => i.product_name === productName)
          .reduce((sum, i) => sum + i.requested_quantity, 0);

        const remainingNeeded = expectedQty - alreadyScannedUnits;
        if (remainingNeeded <= 0) {
          throw new Error(`Already scanned ${expectedQty} units of "${productName}"`);
        }

        const qtyToTake = Math.min(quantityInBox, remainingNeeded);

        playBeep();

        setPendingItem({
          barcode: decodedText,
          box_id: boxId,
          product_name: productName,
          requested_quantity: qtyToTake,
          quantity_in_box: quantityInBox,
          order_id: order.order_id,
        });
        setShowConfirmModal(true);

        toast.dismiss();
        toast.success("QR Code Scanned & Validated!", {
          icon: "Success",
          duration: 2000,
        });
      } catch (err) {
        new Audio("/sounds/error-beep.mp3").play().catch(() => { });

        toast.dismiss();
        toast.error(err.message || "Invalid QR Code");
      } finally {
        setIsScanning(false);
      }
    };

    const onScanFailure = (error) => {
      if (error && !error.includes("No QR code found")) {
        console.warn("QR Scan Failure:", error);
      }
    };

    try {
      html5Scanner.render(onScanSuccess, onScanFailure);
      console.log("QR Scanner initialized");
    } catch (err) {
      toast.error("Camera access denied");
    }

    scannerRef.current = html5Scanner;
    setScanner(html5Scanner);

    return () => {
      scannerRef.current?.clear().catch(() => { });
      scannerRef.current = null;
    };
  }, [order?.order_id, isScanning, itemsToScan]);

  const confirmScan = () => {
    if (!pendingItem) return;
    setItemsToScan((prev) => [...prev, pendingItem]);
    setPendingItem(null);
    setShowConfirmModal(false);
    toast.success("Item confirmed!");
  };

  const removeItem = (barcode) => {
    setItemsToScan((prev) => prev.filter((i) => i.barcode !== barcode));
    toast.info("Item removed");
  };

  const completeAndShip = async () => {
    if (itemsToScan.length === 0) {
      toast.error("No items scanned");
      return;
    }

    const payload = itemsToScan.map((i) => ({
      box_id: i.box_id,
      requested_quantity: i.requested_quantity,
      order_id: i.order_id,
    }));

    const loadingId = toast.loading("Shipping order...");
    try {
      const sellResponse = await apiService.sellStockBatch(payload);
      if (sellResponse.status !== "success") {
        throw new Error(sellResponse.message || "Failed to sell");
      }

      const updateResponse = await apiService.updateOrder(order.order_id, {
        status: "shipped",
      });
      if (updateResponse.status !== "success") {
        throw new Error("Failed to update order");
      }

      toast.success("Order shipped!", { id: loadingId });
      onComplete();
    } catch (err) {
      toast.error(err.message || "Ship failed", { id: loadingId });
    }
  };

  // Count total units scanned
  const totalScannedUnits = itemsToScan.reduce((s, i) => s + i.requested_quantity, 0);
  const totalExpectedUnits = order.order_details?.reduce((s, d) => s + d.quantity, 0) || 0;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
          <h3 className="text-2xl font-bold mb-2">Scan Items to Ship</h3>
          <p className="text-sm text-gray-600 mb-4">
            Order: <strong>{order.order_number}</strong>
          </p>

          {/* Progress */}
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg text-center border border-blue-200">
            <p className="text-lg font-bold text-indigo-800">
              {totalScannedUnits} / {totalExpectedUnits} units scanned
            </p>
            {totalScannedUnits >= totalExpectedUnits && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                All items ready to ship!
              </p>
            )}
          </div>

          {/* Scanned Items */}
          {itemsToScan.length > 0 && (
            <div className="mb-4 max-h-40 overflow-y-auto border rounded-lg bg-gray-50">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-center font-medium">Qty</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToScan.map((item) => (
                    <tr key={item.barcode} className="border-t hover:bg-gray-100">
                      <td className="px-3 py-2 text-gray-800">{item.product_name}</td>
                      <td className="px-3 py-2 text-center font-medium">
                        {item.requested_quantity}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeItem(item.barcode)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Scanner */}
          <div
            id="reader"
            className="w-full mb-4 min-h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
          >
            <p className="text-gray-500">Loading camera...</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={completeAndShip}
              disabled={totalScannedUnits < totalExpectedUnits}
              className="flex-1 py-3 bg-[#153087] text-white rounded-lg font-medium hover:bg-[#9a7516] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Complete & Ship
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && pendingItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h4 className="font-bold text-lg mb-3 text-green-700">Confirm Item</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Product:</strong> {pendingItem.product_name}</p>
              <p><strong>Available in Box:</strong> {pendingItem.quantity_in_box}</p>

              {/* Quantity Input */}
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Remove (max {pendingItem.requested_quantity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={pendingItem.requested_quantity}
                  value={pendingItem.requested_quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setPendingItem((prev) => ({
                      ...prev,
                      requested_quantity: Math.min(val, prev.quantity_in_box),
                    }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-center"
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Barcode: {pendingItem.barcode}
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingItem(null);
                }}
                className="flex-1 py-2 bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmScan}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}