// app/enter-code/page.js
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/client';
import toast from 'react-hot-toast';
import LoginBanner from '@/components/LoginBanner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EnterCodePage() {
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [autoVerifyAttempted, setAutoVerifyAttempted] = useState(false);

    const inputRefs = useRef([]);
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get('email');

    useEffect(() => {
        if (!emailFromQuery) {
            toast.error('Email not provided. Please request a password reset first.');
            router.replace('/forgot-password');
        }
    }, [emailFromQuery, router]);

    useEffect(() => {
        let timerInterval;
        if (resendTimer > 0) {
            timerInterval = setInterval(() => {
                setResendTimer((prevTime) => prevTime - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            clearInterval(timerInterval);
        }

        return () => clearInterval(timerInterval);
    }, [resendTimer]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleVerifyCode = useCallback(async () => {
        setLoading(true);

        const otp = otpDigits.join('');

        if (!emailFromQuery) {
            toast.error('Email not found for verification. Please request a password reset first.');
            setLoading(false);
            return;
        }

        if (otp.length !== 6) {
            setLoading(false);
            return;
        }

        try {
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: emailFromQuery,
                token: otp,
                type: 'recovery',
            });

            if (verifyError) {
                toast.error(verifyError.message || 'Invalid code. Please try again.');
                if (inputRefs.current[0]) {
                    inputRefs.current[0].focus();
                }
            } else {
                toast.success('Code verified successfully!');
                router.push('/update-password?from=recovery');
            }
        } catch (err) {
            console.errror(err)
            toast.error('An unexpected error occurred. Please try again.');
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        } finally {
            setLoading(false);
        }
    }, [otpDigits, emailFromQuery, supabase, router]);

    useEffect(() => {
        const otp = otpDigits.join('');
        if (otp.length === 6 && !loading && !autoVerifyAttempted) {
            handleVerifyCode();
            setAutoVerifyAttempted(true);
        }
    }, [otpDigits, loading, autoVerifyAttempted, handleVerifyCode]);


    const handleOtpChange = (e, index) => {
        const { value } = e.target;
        if (!/^\d*$/.test(value)) return;

        const newOtpDigits = [...otpDigits];
        newOtpDigits[index] = value.slice(-1);

        setOtpDigits(newOtpDigits);

        if (value && index < otpDigits.length - 1 && newOtpDigits[index] !== '') {
            inputRefs.current[index + 1].focus();
        } else if (index === otpDigits.length - 1 && newOtpDigits[index] !== '') {
            inputRefs.current[index].blur();
        }
    };

    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleResendCode = async () => {
        if (!emailFromQuery) {
            toast.error('Email not found. Please go back and enter your email.');
            return;
        }
        if (resendTimer > 0) {
            return;
        }

        setResendLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(emailFromQuery);

        if (error) {
            toast.error(error.message || 'Failed to resend code.');
            console.error('Resend code error:', error.message);
        } else {
            toast.success('New code sent! Check your inbox.');
            setResendTimer(60);
            setOtpDigits(['', '', '', '', '', '']);
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
            setAutoVerifyAttempted(false);
        }
        setResendLoading(false);
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
                                <h2 className="text-2xl font-bold">Verify Code</h2>
                                <p className="text-[16px] text-[#878484]">
                                    Please enter the 6-digit code sent to: <span className="font-semibold text-[#cd9e27]">{emailFromQuery || 'your email'}</span>
                                </p>
                            </div>
                            <div>
                                <form className="mt-7">
                                    <div id="otp-inputs" className="flex gap-4 mb-4">
                                        {otpDigits.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => (inputRefs.current[index] = el)}
                                                type="text"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) => handleOtpChange(e, index)}
                                                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                                className="w-12 h-12 text-center text-2xl font-bold border border-solid border-[#DDD9D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b88b1b] focus:border-[#b88b1b]"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                disabled={loading}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className={`${loading ? "bg-[#b88b1b99] cursor-not-allowed" : "bg-[#b88b1b] cursor-pointer hover:bg-[#ad841a]"} rounded-xl px-4 py-3 w-full mt-8 text-white`}
                                        onClick={() => {
                                            if (!loading && otpDigits.join('').length === 6) {
                                                setAutoVerifyAttempted(false); 
                                                handleVerifyCode();
                                            } else if (otpDigits.join('').length !== 6) {
                                                toast.error('Please enter the full 6-digit code.');
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Verifying...' : 'Verify Code'}
                                    </button>
                                </form>

                                <p className="mt-4 text-center flex justify-center gap-2 items-center text-sm">
                                    <span className='text-gray-400'>Didn't receive the code?</span>
                                    {resendTimer > 0 ? (
                                        <span className="font-medium text-[#b88b1b] opacity-80">
                                            Resend in {formatTime(resendTimer)}
                                        </span>
                                    ) : (
                                        <span
                                            className={`${resendLoading ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer text-[#b88b1b] hover:opacity-80'}`}
                                            onClick={handleResendCode}
                                            disabled={resendLoading}
                                        >
                                            {resendLoading ? 'Resending...' : 'Click to resend'}
                                        </span>
                                    )}
                                </p>

                                <p className="mt-4 text-center flex justify-center gap-2 items-center text-sm text-[#b88b1b] hover:opacity-80">
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                    <Link href="/forgot-password" className="font-medium">
                                        Back to enter email
                                    </Link>
                                </p>
                            </div>
                        </div>
                        {/* Pagination dots */}
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