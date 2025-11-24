// app/(dashboard)/inventory/page.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faCubes,
  faTruck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";
import { NewOrdersTable } from "@/components/inventory/NewOrdersTable";
import { TopSellingProducts } from "@/components/inventory/TopSellingProducts";
import { RecentTransactionsTable } from "@/components/inventory/RecentTransactionsTable";

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 animate-pulse">
    <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4"></div>
    <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
    <div className="h-10 bg-gray-300 rounded w-20"></div>
  </div>
);

export default function InventoryDashboard() {
  const [greeting, setGreeting] = useState("");
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalComponents: 0,
    deliveredOrders: 0,
    activeWarehouseEmployees: 0,
  });
  const [loading, setLoading] = useState(true);
  const timeRef = useRef(null);
  const router = useRouter();
  const first_name = localStorage.getItem("first_name") || "User";

  useEffect(() => {
    const updateGreetingAndTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const newGreeting =
        hours >= 5 && hours < 12
          ? "Good Morning"
          : hours >= 12 && hours < 18
          ? "Good Afternoon"
          : "Good Evening";
      setGreeting(newGreeting);

      if (timeRef.current) {
        timeRef.current.textContent = now.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Africa/Lagos",
        });
      }
    };

    updateGreetingAndTime();
    const interval = setInterval(updateGreetingAndTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);

        const [productsRes, componentsRes, ordersRes, employeesRes] = await Promise.all([
          apiService.getProducts(router),
          apiService.getComponents(router),
          apiService.getOrders(router),
          apiService.getEmployees(router),
        ]);

        // Safely extract data arrays
        const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
        const components = Array.isArray(componentsRes?.data) ? componentsRes.data : [];
        const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
        const employees = Array.isArray(employeesRes?.data) ? employeesRes.data : [];

        // Count delivered orders
        const deliveredOrders = orders.filter(
          (order) => order.status?.toLowerCase() === "delivered"
        ).length;

        // Count employees in Warehouse department AND active
        const activeWarehouseEmployees = employees.filter((emp) => {
          const isWarehouse = emp.department?.name?.toLowerCase() === "warehouse";
          const isActive = emp.status?.toLowerCase() === "active" || emp.is_active === true;
          return isWarehouse && isActive;
        }).length;

        setMetrics({
          totalProducts: products.length,
          totalComponents: components.length,
          deliveredOrders,
          activeWarehouseEmployees,
        });
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        setMetrics({
          totalProducts: 0,
          totalComponents: 0,
          deliveredOrders: 0,
          activeWarehouseEmployees: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, [router]);

  const inventoryCards = [
    {
      title: "Total Products",
      count: loading ? "-" : metrics.totalProducts.toLocaleString(),
      borderColor: "border-blue-500",
      textColor: "text-blue-800",
      icon: faBoxOpen,
      bgGradient: "from-blue-50 to-blue-100",
    },
    {
      title: "Total Components",
      count: loading ? "-" : metrics.totalComponents.toLocaleString(),
      borderColor: "border-purple-500",
      textColor: "text-purple-800",
      icon: faCubes,
      bgGradient: "from-purple-50 to-purple-100",
    },
    {
      title: "Delivered Orders",
      count: loading ? "-" : metrics.deliveredOrders.toLocaleString(),
      borderColor: "border-green-500",
      textColor: "text-green-800",
      icon: faTruck,
      bgGradient: "from-green-50 to-green-100",
    },
    {
      title: "Active Warehouse Employees",
      count: loading ? "-" : metrics.activeWarehouseEmployees,
      borderColor: "border-orange-500",
      textColor: "text-orange-800",
      icon: faUsers,
      bgGradient: "from-orange-50 to-orange-100",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Overview</h1>
          <p className="text-gray-600 font-medium mt-2">
            {greeting}, {first_name}!
          </p>
        </div>
        <span
          ref={timeRef}
          className="bg-gray-100 text-gray-600 px-6 py-3 rounded-2xl border border-gray-300 text-sm font-medium"
        ></span>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : (
          inventoryCards.map((card, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl shadow-lg p-6 border-l-4 ${card.borderColor} hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between mb-4">
                <FontAwesomeIcon
                  icon={card.icon}
                  className="text-5xl opacity-30"
                  style={{ color: card.textColor.replace("800", "600") }}
                />
              </div>
              <h3 className="text-gray-700 text-sm font-semibold uppercase tracking-wider">
                {card.title}
              </h3>
              <p className={`text-5xl font-extrabold mt-3 ${card.textColor}`}>
                {card.count}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>
            <NewOrdersTable />
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Top Selling Products</h2>
            <TopSellingProducts />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Transactions</h2>
        <RecentTransactionsTable />
      </div>
    </div>
  );
}