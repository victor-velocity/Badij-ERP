// app/update-password/page.js

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import LoginBanner from '@/components/LoginBanner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
import Link from 'next/link';

export default function UpdatePasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // Password validation states
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasLowercase, setHasLowercase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasSpecialChar, setHasSpecialChar] = useState(false);
    const [isMinLength, setIsMinLength] = useState(false);

    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        async function checkSessionAndOrigin() {
            const fromRecovery = searchParams.get('from') === 'recovery';
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Session expired or invalid.');
                router.replace('/forgot-password');
                return;
            }

            if (session && !fromRecovery) {
                toast.error('Unauthorized access.');
                router.replace('/dashboard');
                return;
            }

        }
        checkSessionAndOrigin();
    }, [supabase, router, searchParams]);

    useEffect(() => {
        // Password validation logic
        setHasUppercase(/[A-Z]/.test(newPassword));
        setHasLowercase(/[a-z]/.test(newPassword));
        setHasNumber(/[0-9]/.test(newPassword));
        setHasSpecialChar(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword));
        setIsMinLength(newPassword.length >= 8);
    }, [newPassword]);

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

        // Enforce all password policy checks before submission
        if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar || !isMinLength) {
            setPasswordError('Password does not meet all requirements.');
            setLoading(false);
            return;
        }

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) {
                toast.error(updateError.message || 'Failed to update password.');
                console.error('Password Update Error:', updateError.message);
            } else {
                toast.success('Your password has been updated successfully!');
                router.push('/success');
            }
        } catch (err) {
            console.error('An unexpected error occurred:', err);
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const PasswordCheck = ({ condition, text }) => (
        <div className={`flex items-center gap-2 text-sm ${condition ? 'text-green-600' : 'text-gray-500'}`}>
            <FontAwesomeIcon icon={condition ? faCheckCircle : faTimesCircle} />
            <span>{text}</span>
        </div>
    );

    // Combine all conditions for disabling the button
    const isButtonDisabled = loading || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar || !isMinLength || newPassword !== confirmNewPassword;

    return (
        <section className="flex justify-center items-center h-[100vh]">
            <div className="flex justify-center items-center flex-nowrap gap-7 w-full max-w-[1200px] banner-width p-5">
                <LoginBanner />
                <div className="w-1/2 login-div h-full">
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
                                            className="absolute right-3 top-[45%] -translate-y-1/2 cursor-pointer text-[#A09D9D]"
                                        >
                                            <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} />
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <PasswordCheck condition={hasUppercase} text="one uppercase character" />
                                        <PasswordCheck condition={hasSpecialChar} text="one special character" />
                                        <PasswordCheck condition={hasLowercase} text="one lowercase character" />
                                        <PasswordCheck condition={isMinLength} text="8 character minimum" />
                                        <PasswordCheck condition={hasNumber} text="one number" />
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
                                            className="absolute right-3 top-[45%] -translate-y-1/2 cursor-pointer text-[#A09D9D]"
                                        >
                                            <FontAwesomeIcon icon={showConfirmNewPassword ? faEye : faEyeSlash} />
                                        </span>
                                    </div>

                                    {passwordError && (
                                        <div className="text-red-500 text-sm mt-2 mb-4">{passwordError}</div>
                                    )}

                                    <button
                                        type="submit"
                                        className={`${isButtonDisabled ? "bg-[#b88b1b99] cursor-not-allowed" : "bg-[#b88b1b] cursor-pointer hover:bg-[#ad841a]"} rounded-xl px-4 py-3 w-full mt-8 text-white`}
                                        disabled={isButtonDisabled}
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
                        <div className='pagination flex gap-3 justify-center items-center mt-8'>
                            <div className='w-[12px] h-[12px] bg-[#ddd9d9] rounded-full'></div>
                            <div className='w-[12px] h-[12px] bg-[#ddd9d9] rounded-full'></div>
                            <div className='w-[12px] h-[12px] bg-[#b88b1b] rounded-full'></div>
                            <div className='w-[12px] h-[12px] bg-[#ddd9d9] rounded-full'></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}