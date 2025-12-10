// components/sales/TopSellingProducts.jsx
import React, { useState, useEffect } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

const TopSellingProducts = () => {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTopSellingProducts = async () => {
      try {
        setLoading(true);
        const ordersResponse = await apiService.getOrders(router);
        const orders = ordersResponse?.data || [];

        // Count product sales from order_details
        const productCount = {};

        orders.forEach(order => {
          if (order.order_details && Array.isArray(order.order_details)) {
            order.order_details.forEach(item => {
              const productId = item.product_id;
              const productName = item.product?.name || item.product_name || `Product ${productId}`;
              const quantity = Number(item.quantity) || 1;

              if (!productCount[productId]) {
                productCount[productId] = {
                  name: productName,
                  units: 0
                };
              }
              productCount[productId].units += quantity;
            });
          }
        });

        // Convert to array, sort by units sold, take top 5
        const sortedProducts = Object.values(productCount)
          .sort((a, b) => b.units - a.units)
          .slice(0, 5);

        setTopProducts(sortedProducts.length > 0 ? sortedProducts : []);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopSellingProducts();
  }, [router]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 h-full flex flex-col border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Top Selling Products</h2>
          <p className="text-sm text-gray-500 mt-1">All time best performers</p>
        </div>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          All Time
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : topProducts.length > 0 ? (
        <div className="space-y-5 flex-1">
          {topProducts.map((product, index) => (
            <div key={index} className="flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-gray-300 w-8 text-right">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-800 group-hover:text-[#153087] transition">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.units} unit{product.units > 1 ? 's' : ''} sold
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {product.units}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center">
            No sales yet.<br />
            <span className="text-sm">Products will appear once orders are placed.</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default TopSellingProducts;