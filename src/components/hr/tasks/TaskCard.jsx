import React from "react";

export default function TaskCard({ title, no }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <p className="text-gray-600 mb-2">{no}</p>
        </div>
    );
}