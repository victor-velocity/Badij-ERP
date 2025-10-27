"use client"

import { useState } from 'react';
import apiService from '@/app/lib/apiService';
import { useRouter } from 'next/navigation';

const AssignmentForm = ({ moduleId, onSuccess }) => {
  const [targetType, setTargetType] = useState('all');
  const [targetValue, setTargetValue] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const assignmentData = { target_type: targetType, target_value: targetValue };

    try {
      await apiService.createAssignment(moduleId, assignmentData, router);
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
        <label htmlFor="targetType">Target Type</label>
        <select
          id="targetType"
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="border p-2 w-full"
        >
          <option value="department">Department</option>
          <option value="role">Role</option>
          <option value="all">All</option>
        </select>
      </div>
      <div>
        <label htmlFor="targetValue">Target Value</label>
        <input
          id="targetValue"
          type="text"
          value={targetValue}
          onChange={(e) => setTargetValue(e.target.value)}
          required
          className="border p-2 w-full"
        />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit" disabled={loading} className="bg-blue-500 text-white p-2">
        {loading ? 'Creating...' : 'Create Assignment'}
      </button>
    </form>
  );
};

export default AssignmentForm;