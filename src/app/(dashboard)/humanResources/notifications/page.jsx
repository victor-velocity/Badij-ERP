// app/notifications/page.js
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter, useSearchParams } from 'next/navigation';
import toast from "react-hot-toast";
import GmailConnection from "@/components/notifications/GmailConnection";
import EmailList from "@/components/notifications/EmailList";

export default function NotificationsPage() {
    const [user, setUser] = useState(null);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [gmailConnected, setGmailConnected] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState('');

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const formatted = now.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            setCurrentDateTime(formatted);
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 1000);
        return () => clearInterval(intervalId);
    }, []);

    // Handle OAuth callback results
    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const message = searchParams.get('message');

        if (success === 'gmail_connected') {
            toast.success('Gmail connected successfully!');
            handleGmailConnected();
            // Clean URL without reload
            window.history.replaceState({}, '', window.location.pathname);
        }

        if (error) {
            toast.error(message || `Authentication error: ${error}`);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [searchParams]);

    useEffect(() => {
        checkAuthAndConnection();
    }, []);

    const checkAuthAndConnection = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                router.push('/login');
                return;
            }

            setUser(user);
            await checkGmailConnection(user.id);

        } catch (error) {
            console.error('Auth check error:', error);
            toast.error('Authentication error');
            router.push('/login');
        }
    };

    const checkGmailConnection = async (userId) => {
        try {
            console.log('Checking Gmail connection for user:', userId);

            const { data, error } = await supabase
                .from('user_google_tokens')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            console.log('Database query result:', {
                hasData: !!data,
                error: error?.message,
                data: data ? {
                    hasAccessToken: !!data.access_token,
                    hasRefreshToken: !!data.refresh_token,
                    expiresAt: data.expires_at
                } : null
            });

            if (error) {
                console.error('Gmail connection check error:', error);
                setGmailConnected(false);
            } else {
                setGmailConnected(!!data);
                if (data) {
                    await fetchEmails();
                }
            }
        } catch (error) {
            console.error('Error checking Gmail connection:', error);
            setGmailConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/emails');

            if (response.status === 401) {
                setGmailConnected(false);
                toast.error("Gmail access expired. Please reconnect.");
                return;
            }

            if (response.status === 403) {
                setGmailConnected(false);
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch emails');
            }

            const data = await response.json();
            setEmails(data.emails || []);
        } catch (error) {
            console.error('Error fetching emails:', error);
            if (error.message !== 'Failed to fetch emails') {
                toast.error("Failed to load emails");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGmailConnected = () => {
        setGmailConnected(true);
        fetchEmails();
    };

    const handleGmailDisconnected = () => {
        setGmailConnected(false);
        setEmails([]);
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b88b1b]"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className='flex justify-between items-center mb-8 flex-wrap gap-4'>
                <div>
                    <h1 className='text-2xl font-bold'>My Notifications</h1>
                    <p className='text-[#A09D9D] font-medium mt-2'>View and manage your email notifications</p>
                </div>
                <span className='rounded-[20px] px-3 py-2 border-[0.5px] border-solid border-[#DDD9D9] text-[#A09D9D]'>
                    {currentDateTime}
                </span>
            </div>

            <div className="mb-8 text-center">
                <h2 className="text-xl font-semibold text-[#b88b1b] mb-4">Welcome, {user.email}</h2>
                <p className="text-black">Connect your personal Gmail to view notifications</p>
            </div>

            <GmailConnection
                isConnected={gmailConnected}
                onConnected={handleGmailConnected}
                onDisconnected={handleGmailDisconnected}
            />

            {gmailConnected && (
                <EmailList
                    emails={emails}
                    loading={loading}
                    onRefresh={fetchEmails}
                />
            )}
        </div>
    );
}