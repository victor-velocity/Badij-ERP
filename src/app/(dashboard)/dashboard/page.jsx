// app/dashboard/page.js or app/profile/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false); // NEW: State for logout loading
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No user session, redirect to login
        router.push('/login');
        return;
      }

      // Now fetch the profile data from your 'profiles' table
      // IMPORTANT: Added 'id' to the select statement to ensure profile.id is available
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url') // Select the columns you need, including 'id'
        .eq('id', user.id) // Link to the auth.user.id
        .single(); // Expect only one row

      if (error) {
        console.error('Error fetching profile:', error.message);
        setError(error.message);
        toast.error('Failed to load profile data.');
      } else if (data) {
        setProfile(data);
      } else {
        // This might happen if a user authenticates but no corresponding profile row exists yet
        console.warn('No profile found for user:', user.id);
        // NEW: Ensure 'id' is included in the default profile object
        setProfile({ id: user.id, username: 'N/A', full_name: 'New User', avatar_url: null });
        // You might want to automatically create a profile here or prompt the user to create one
        toast.info('Please complete your profile information.');
      }
      setLoading(false);
    }

    getProfile();
  }, [supabase, router]); // Dependency array for useEffect

  // NEW: handleLogout function
  const handleLogout = async () => {
    setLogoutLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message || 'Failed to log out.');
      console.error('Logout error:', error.message);
    } else {
      toast.success('Successfully logged out!');
      router.push('/'); // Redirect to login page after logout
    }
    setLogoutLoading(false);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading profile...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;
  }

  if (!profile) {
      return <div className="flex justify-center items-center h-screen">No profile data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        {profile.avatar_url && (
          <img
            src={profile.avatar_url}
            alt="User Avatar"
            className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          />
        )}
        <p className="text-xl mb-2"><strong>Username:</strong> {profile.username}</p>
        <p className="text-lg mb-2"><strong>Full Name:</strong> {profile.full_name}</p>
        {/* Adjusted to use profile.id, which is now selected */}
        <p className="text-sm text-gray-500 mt-4">
          User ID: {profile.id}
        </p>
        {/* Add a button to edit profile or navigate */}
        {/* <button className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Edit Profile</button> */}

        {/* NEW: Logout Button */}
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="mt-6 bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
        >
          {logoutLoading ? 'Logging Out...' : 'Logout'}
        </button>
      </div>
    </div>
  );
}