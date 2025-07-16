import React from "react";

export default function TaskCard({ title, no }) {
    return (
        <div className="bg-white rounded-lg shadow-md py-3 px-4 mb-4 min-w-[200px] flex-grow border-[0.5px] border-solid border-[#DDD9D9]">
            <h2 className="text-[16px] font-bold text-[#A09D9D] mb-3">{title}</h2>
            <p className="text-black font-bold text-3xl">{no}</p>
        </div>
    );
}