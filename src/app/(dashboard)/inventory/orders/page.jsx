"use client";

import React, { useState, useEffect } from "react";
import { useRouter, searchParams } from "next/navigation";
import OrdersClientWrapper from "@/components/inventory/orders/OrdersClientWrapper";
import apiService from "@/app/lib/apiService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faTruck,
  faCheckCircle,
  faClipboardList,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";

const SkeletonStatCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
    <div className="p-3 rounded-full bg-gray-200 w-12 h-12 animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
      <div className="h-6 bg-gray-300 rounded w-16 animate-pulse" />
    </div>
  </div>
);

export default function InventoryOrders() {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [greeting, setGreeting] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const first_name = localStorage.getItem("first_name");

  const calculateStats = (orders) => {
    const relevant = orders.filter((o) =>
      ["processing", "shipped", "delivered"].includes(o.status)
    );
    const total = relevant.length;
    const processing = relevant.filter((o) => o.status === "processing").length;
    const shipped = relevant.filter((o) => o.status === "shipped").length;
    const delivered = relevant.filter((o) => o.status === "delivered").length;

    return { total, processing, shipped, delivered, relevant };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOrders(router);
      setOrders(response?.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [router]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      setGreeting(
        h >= 5 && h < 12
          ? "Good Morning"
          : h >= 12 && h < 18
          ? "Good Afternoon"
          : "Good Evening"
      );
      setCurrentDateTime(
        now.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const { total, processing, shipped, delivered, relevant } = calculateStats(orders);

  const handlePrint = () => window.print();

  return (
    <>
      {/* ---------- PRINT-ONLY STYLES ---------- */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-section,
          #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .print-table th,
          .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .print-table th { background: #f7f7f7; font-weight: bold; }
          .print-table tr:nth-child(even) { background: #f9f9f9; }
          .print-header { text-align: center; margin-bottom: 20px; }
          .print-stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .print-stat-box { text-align: center; padding: 10px; border: 1px solid #ccc; border-radius: 8px; width: 22%; }
          @page { size: A4; margin: 1cm; }
        }
        /* Hide print section on screen */
        #print-section { display: none; }
        @media print { #print-section { display: block; } }
      `}</style>

      {/* ---------- SCREEN UI ---------- */}
      <div className="no-print">
        <div className="flex justify-between items-center mt-5 mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory Orders</h1>
            <p className="text-[#A09D9D] font-medium mt-2">
              {greeting}, {first_name}
            </p>
          </div>
          <div className="flex gap-3">
            <span className="rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]">
              {currentDateTime}
            </span>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#153087] text-white rounded-lg flex items-center gap-2 hover:bg-[#9a7516] transition-colors"
            >
              <FontAwesomeIcon icon={faPrint} />
              Print Report
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => <SkeletonStatCard key={i} />)
            : [
                { title: "Total Orders", count: `${total} orders`, color: "bg-indigo-100 text-indigo-800", icon: <FontAwesomeIcon icon={faClipboardList} className="w-6 h-6" /> },
                { title: "Processing", count: `${processing} orders`, color: "bg-yellow-100 text-yellow-800", icon: <FontAwesomeIcon icon={faBox} className="w-6 h-6" /> },
                { title: "Shipped", count: `${shipped} orders`, color: "bg-blue-100 text-blue-800", icon: <FontAwesomeIcon icon={faTruck} className="w-6 h-6" /> },
                { title: "Delivered", count: `${delivered} orders`, color: "bg-green-100 text-green-800", icon: <FontAwesomeIcon icon={faCheckCircle} className="w-6 h-6" /> },
              ].map((c, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className={`p-3 rounded-full ${c.color}`}>{c.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{c.title}</p>
                    <p className="text-xl font-bold text-gray-900">{c.count}</p>
                  </div>
                </div>
              ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="b overflow-hidden">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {["Order ID", "Products", "Order Date", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                      <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded-full w-24 mx-auto"></div></td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <div className="w-5 h-5 bg-gray-200 rounded"></div>
                          <div className="w-5 h-5 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 bg-white rounded-xl shadow-sm border border-gray-200">
            Error: {error}
          </div>
        ) : (
          <OrdersClientWrapper orders={orders} router={router} />
        )}
      </div>

      {/* ---------- PRINT-ONLY REPORT ---------- */}
      <div id="print-section">
        <div className="print-header">
          <h1 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>Inventory Orders Report</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Generated on: {new Date().toLocaleString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>

        <div className="print-stats">
          <div className="print-stat-box">
            <p style={{ fontSize: "14px", margin: "0 0 4px 0", color: "#555" }}>Total Orders</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>{total}</p>
          </div>
          <div className="print-stat-box">
            <p style={{ fontSize: "14px", margin: "0 0 4px 0", color: "#555" }}>Processing</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#d97706" }}>{processing}</p>
          </div>
          <div className="print-stat-box">
            <p style={{ fontSize: "14px", margin: "0 0 4px 0", color: "#555" }}>Shipped</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#2563eb" }}>{shipped}</p>
          </div>
          <div className="print-stat-box">
            <p style={{ fontSize: "14px", margin: "0 0 4px 0", color: "#555" }}>Delivered</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0, color: "#16a34a" }}>{delivered}</p>
          </div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Products</th>
              <th>Order Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {relevant.map((o) => (
              <tr key={o.order_id}>
                <td>{o.order_number}</td>
                <td>
                  {o.order_details
                    ?.map((d) => `${d.product_id.name} (x${d.quantity})`)
                    .join(", ")}
                </td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "medium",
                      backgroundColor:
                        o.status === "processing"
                          ? "#fef9c3"
                          : o.status === "shipped"
                          ? "#dbeafe"
                          : "#d1fae5",
                      color:
                        o.status === "processing"
                          ? "#92400e"
                          : o.status === "shipped"
                          ? "#1e40af"
                          : "#166534",
                    }}
                  >
                    {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {relevant.length === 0 && (
          <p style={{ textAlign: "center", color: "#666", marginTop: "20px" }}>
            No inventory orders found.
          </p>
        )}
      </div>
    </>
  );
}