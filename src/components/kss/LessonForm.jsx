// components/kss/LessonForm.jsx
"use client";

import { useState } from "react";
import apiService from "@/app/lib/apiService";
import { useRouter } from "next/navigation";

export default function LessonForm({ moduleId, initialData, onSuccess }) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [youtubeLink, setYoutubeLink] = useState(initialData?.youtube_link ?? "");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      module_id: moduleId,
      title,
      description,
      youtube_link: youtubeLink || null,
    };

    try {
      if (initialData?.id) {
        await apiService.updateLesson(initialData.id, payload, router);
      } else {
        await apiService.createLesson(payload, router);
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

      <div>
        <label className="block text-sm font-medium text-gray-700">YouTube Link</label>
        <input
          type="url"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          placeholder="https://youtube.com/…"
          className="w-full px-3 py-2 border border-solid border-gray-300 shadow-sm mt-2 rounded-md focus:ring-2 focus:ring-[#153087] outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Form owns the submit button */}
      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[#d4a53b] px-6 py-2 text-white hover:bg-[#c49632] disabled:opacity-70 transition"
        >
          {loading ? "Saving…" : initialData?.id ? "Update Lesson" : "Create Lesson"}
        </button>
      </div>
    </form>
  );
}