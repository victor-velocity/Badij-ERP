import React from "react";

export default function ShiftCard({ title, count }) {
    return (
        <div className="bg-white rounded-lg shadow-md py-5 px-4 mb-4 min-w-[250px] flex-grow border-[0.5px] border-solid border-[#DDD9D9]">
            <h2 className="text-[16px] font-bold text-[rgb(160,157,157)] mb-3">{title}</h2>
            <p className="text-black font-bold text-3xl">{count}</p>
        </div>
    );
}