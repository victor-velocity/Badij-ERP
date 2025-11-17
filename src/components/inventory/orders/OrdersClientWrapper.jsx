"use client";

import { useSearchParams } from "next/navigation";
import OrderListTable from "./OrderListTable";
import { useEffect, useState } from "react";

export default function OrdersClientWrapper({ orders, router }) {
  const searchParams = useSearchParams();
  const autoOpenOrderId = searchParams.get("process");

  return (
    <OrderListTable
      orders={orders}
      router={router}
      autoOpenOrderId={autoOpenOrderId}
    />
  );
}