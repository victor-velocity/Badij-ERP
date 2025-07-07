// app/update-password/page.js

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import LoginBanner from '@/components/LoginBanner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import Link from 'next/link';

export default function UpdatePasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        async function checkSessionAndOrigin() {
            const fromRecovery = searchParams.get('from') === 'recovery';
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Session expired or invalid. Please request a new password reset.');
                router.replace('/forgot-password');
                return;
            }

            if (session && !fromRecovery) {
                toast.error('This page is only for password reset. Please log in normally or initiate a password reset.');
                router.replace('/dashboard');
                return;
            }

        }
        checkSessionAndOrigin();
    }, [supabase, router, searchParams]); // Add searchParams to dependencies to re-run if URL params change

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword((prev) => !prev);
    };

    const toggleConfirmNewPasswordVisibility = () => {
        setShowConfirmNewPassword((prev) => !prev);
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setPasswordError('');

        if (!newPassword.trim() || !confirmNewPassword.trim()) {
            setPasswordError('Please enter and confirm your new password.');
            setLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError('New passwords do not match.');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) {
                toast.error(updateError.message || 'Failed to update password. Your session might not be for password recovery.');
                console.error('Password Update Error:', updateError.message);
            } else {
                toast.success('Your password has been updated successfully! You can now log in.');
                router.push('/login');
            }
        } catch (err) {
            console.error('An unexpected error occurred:', err);
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="flex justify-center items-center h-[100vh]">
            <div className="flex justify-center items-center flex-nowrap gap-7 w-full max-w-[1200px] banner-width p-5">
                <LoginBanner />
                <div className="w-1/2 login-div h-[480px]">
                    <div className='flex flex-col justify-between h-full'>
                        <div>
                            <h4 className="text-xl font-medium text-[#cd9e27]">Madison Jay</h4>
                            <div className="my-4">
                                <h2 className="text-2xl font-bold">Set New Password</h2>
                                <p className="text-[16px] text-[#878484]">
                                    Enter your new password below.
                                </p>
                            </div>
                            <div>
                                <form onSubmit={handlePasswordUpdate} className="mt-7">
                                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mt-4">
                                        Password:
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            id="new-password"
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value);
                                                setPasswordError('');
                                            }}
                                            className="border border-solid border-[#DDD9D9] p-2 text-sm rounded-lg w-full mt-2 mb-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b]"
                                        />
                                        <span
                                            onClick={toggleNewPasswordVisibility}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#A09D9D]"
                                        >
                                            <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} />
                                        </span>
                                    </div>

                                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                        Confirm Password:
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmNewPassword ? "text" : "password"}
                                            id="confirm-password"
                                            placeholder="Confirm new password"
                                            value={confirmNewPassword}
                                            onChange={(e) => {
                                                setConfirmNewPassword(e.target.value);
                                                setPasswordError('');
                                            }}
                                            className="border border-solid border-[#DDD9D9] p-2 text-sm rounded-lg w-full mt-2 mb-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b]"
                                        />
                                        <span
                                            onClick={toggleConfirmNewPasswordVisibility}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#A09D9D]"
                                        >
                                            <FontAwesomeIcon icon={showConfirmNewPassword ? faEye : faEyeSlash} />
                                        </span>
                                    </div>

                                    {passwordError && (
                                        <div className="text-red-500 text-sm mt-2 mb-4">{passwordError}</div>
                                    )}

                                    <button
                                        type="submit"
                                        className={`${loading ? "bg-[#b88b1b99] cursor-not-allowed" : "bg-[#b88b1b] cursor-pointer hover:bg-[#ad841a]"} rounded-xl px-4 py-3 w-full mt-8 text-white`}
                                        disabled={loading}
                                    >
                                        {loading ? 'Updating Password...' : 'Set New Password'}
                                    </button>
                                </form>

                                <p className="mt-4 text-center flex justify-center gap-2 items-center text-sm text-[#b88b1b] hover:opacity-80">
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <Link href="/login" className="font-medium">
                                        Back to log in
                                    </Link>
                                </p>
                            </div>
                        </div>
                        <div className='pagination flex gap-4 justify-center items-center mt-8'>
                            <div className='w-[15px] h-[15px] bg-[#ddd9d9] rounded-full'></div>
                            <div className='w-[15px] h-[15px] bg-[#ddd9d9] rounded-full'></div>
                            <div className='w-[15px] h-[15px] bg-[#b88b1b] rounded-full'></div>
                            <div className='w-[15px] h-[15px] bg-[#ddd9d9] rounded-full'></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}