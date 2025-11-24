// components/sales/RevenueTrendChart.jsx
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area } from 'recharts';
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const RevenueTrendChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRevenueTrend = async () => {
      try {
        setLoading(true);
        const response = await apiService.getOrders(router);
        const orders = response?.data || [];

        // Group by month (last 12 months)
        const monthlyData = {};
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          monthlyData[monthKey] = { revenue: 0, orders: 0 };
        }

        orders.forEach(order => {
          const orderDate = new Date(order.created_at || order.order_date);
          const month = orderDate.toLocaleString('default', { month: 'short' });
          const year = orderDate.getFullYear();

          // Only include last 12 months
          if (orderDate >= new Date(now.getFullYear(), now.getMonth() - 11, 1)) {
            if (!monthlyData[month]) monthlyData[month] = { revenue: 0, orders: 0 };
            monthlyData[month].revenue += Number(order.total_amount || 0);
            monthlyData[month].orders += 1;
          }
        });

        // Convert to array and sort chronologically
        const sortedData = Object.keys(monthlyData)
          .sort((a, b) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months.indexOf(a) - months.indexOf(b);
          })
          .map(month => ({
            month,
            revenue: monthlyData[month].revenue,
            orders: monthlyData[month].orders
          }));

        setChartData(sortedData);
      } catch (error) {
        console.error("Error fetching revenue trend:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueTrend();
  }, [router]);

  const formatCurrency = (value) => `₦${(value / 1000000).toFixed(1)}M`;
  const formatTooltip = (value, name) => {
    if (name === "Revenue") return `₦${value.toLocaleString()}`;
    return value;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 h-full flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
          <p className="mt-4 text-gray-600">Loading revenue trend...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Revenue & Orders Trend</h2>
          <p className="text-sm text-gray-500 mt-1">Last 12 months performance</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
            <span className="text-gray-700 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700 font-medium">Orders</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              yAxisId="left"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#3b82f6"
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{ 
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "10px"
              }}
            />
            <Bar 
              yAxisId="left"
              dataKey="revenue" 
              fill="url(#revenueGradient)"
              radius={[8, 8, 0, 0]}
              barSize={32}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="orders" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 6 }}
              activeDot={{ r: 8 }}
            />
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {chartData.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center">
            No sales data available yet.<br />
            <span className="text-sm">Orders will appear here once created.</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default RevenueTrendChart;