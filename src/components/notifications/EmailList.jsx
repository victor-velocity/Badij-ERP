// components/EmailList.js
"use client";

import React from "react";

export default function EmailList({ emails, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Email Notifications</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#b88b1b]"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">Email Notifications</h3>
        <button
          onClick={onRefresh}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>
      
      {emails.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No emails found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {emails.map((email) => (
            <div key={email.id} className="py-4">
              <div className="flex justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {email.subject || '(No Subject)'}
                </h4>
                <span className="text-xs text-gray-500">
                  {new Date(email.internalDate).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">
                From: {email.from}
              </p>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {email.snippet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}