'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/client';
import toast from 'react-hot-toast';
import LoginBanner from '@/components/LoginBanner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isEmailInvalid, setIsEmailInvalid] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setIsEmailInvalid(false);

        if (!email.trim()) {
            setIsEmailInvalid(true);
            toast.error('Please enter your email address.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            toast.error(error.message || 'Failed to send code.');
        } else {
            toast.success('Code sent successfully! Check your inbox (and spam folder).');
            router.push(`/enter-code?email=${encodeURIComponent(email)}`);
        }
        setLoading(false);
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
                                <h2 className="text-2xl font-bold">Forgot Password?</h2>
                                <p className="text-[16px] text-[#878484]">
                                    Enter your email address below to receive a password reset link.
                                </p>
                            </div>
                            <div>
                                <form onSubmit={handleResetPassword} className="mt-7">
                                    <label htmlFor="email">
                                        Email <span className="text-red-600">*</span>
                                    </label>
                                    <br />
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (isEmailInvalid) setIsEmailInvalid(false);
                                        }}
                                        className={`border border-solid ${isEmailInvalid ? 'border-red-500' : 'border-[#DDD9D9]'
                                            } p-2 text-sm rounded-lg w-full mt-2 mb-4 pr-10 focus:outline-none focus:ring focus:ring-[#b88b1b] focus:border-[#b88b1b]`}
                                    />

                                    <button
                                        type="submit"
                                        className={`${loading ? "bg-[#b88b1b99] cursor-not-allowed" : "bg-[#b88b1b] cursor-pointer hover:bg-[#ad841a]"} rounded-xl px-4 py-3 w-full mt-8 text-white`}
                                        disabled={loading}
                                    >
                                        {loading ? 'Sending...' : 'Send Reset Code'}
                                    </button>
                                </form>

                                <p className="mt-4 text-center flex justify-center gap-2 items-center text-sm text-[#b88b1b] hover:opacity-80">
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <Link href="/" className="font-medium">
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