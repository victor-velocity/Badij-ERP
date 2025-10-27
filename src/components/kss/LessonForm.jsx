"use client"

import { useState } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const LessonForm = ({ moduleId, initialData, onSuccess }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [youtubeLink, setYoutubeLink] = useState(initialData?.youtube_link || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const lessonData = { module_id: moduleId, title, description, youtube_link: youtubeLink };

    try {
      if (initialData?.id) {
        await apiService.updateLesson(initialData.id, lessonData, router);
      } else {
        await apiService.createLesson(lessonData, router);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      <div>
        <label htmlFor="youtubeLink">YouTube Link</label>
        <input
          id="youtubeLink"
          type="url"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          className="border p-2 w-full"
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2">
        {loading ? 'Saving...' : initialData?.id ? 'Update Lesson' : 'Create Lesson'}
      </button>
    </form>
  );
};

export default LessonForm;