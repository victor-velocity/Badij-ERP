import React from "react";

export const InventoryCard = ({ title, count, borderColor, textColor }) => {
  return (
    <div className={`rounded-lg p-6 shadow-md ${borderColor} ${textColor}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold">{count} items</p>
    </div>
  );
};