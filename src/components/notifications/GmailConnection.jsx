// components/notifications/GmailConnection.js
"use client";

import React, { useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import toast from "react-hot-toast";
import { usePathname } from 'next/navigation';

export default function GmailConnection({ isConnected, onConnected, onDisconnected }) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const supabase = createClient();
  const pathname = usePathname();

  const connectGmail = async () => {
    setConnecting(true);
    try {
      // Store the return path in state
      const state = JSON.stringify({ returnTo: pathname });
      
      // Use the correct scope for modify permissions
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/gmail.modify', // CHANGED TO MODIFY
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            state: encodeURIComponent(state),
          },
        },
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast.error('Failed to connect Gmail. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectGmail = async () => {
    setDisconnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Delete the token from database
      const { error } = await supabase
        .from('user_google_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Gmail disconnected successfully');
      onDisconnected();
      
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error(error.message || 'Failed to disconnect Gmail');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Gmail Connection</h3>

      {isConnected ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-700">Your Gmail account is connected</span>
          </div>
          <button
            onClick={disconnectGmail}
            disabled={disconnecting}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-gray-700">Connect your Gmail to view notifications</span>
          </div>
          <button
            onClick={connectGmail}
            disabled={connecting}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect Gmail'}
          </button>
        </div>
      )}
    </div>
  );
}