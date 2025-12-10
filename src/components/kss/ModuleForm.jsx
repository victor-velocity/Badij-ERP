// components/kss/ModuleForm.jsx
"use client";

import { useState } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

export default function ModuleForm({ initialData, onSuccess }) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = { title, description };

    try {
      if (initialData?.id) {
        await apiService.updateModule(initialData.id, payload, router);
      } else {
        await apiService.createModule(payload, router);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-solid border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#153087] outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-solid border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#153087] outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end mt-7">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[#d4a53b] px-6 py-2 text-white hover:bg-[#c49632] disabled:opacity-70 transition"
        >
          {loading ? "Saving…" : initialData?.id ? "Update Module" : "Create Module"}
        </button>
      </div>
    </form>
  );
}