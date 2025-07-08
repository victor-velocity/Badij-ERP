// app/password-changed-success/page.js
'use client';

import React from 'react';
import Link from 'next/link';
import LoginBanner from '@/components/LoginBanner'; // Assuming this component exists
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

export default function PasswordChangedSuccessPage() {
    return (
        <section className="flex justify-center items-center h-[100vh]">
            <div className="flex justify-center items-center flex-nowrap gap-7 w-full max-w-[1200px] banner-width p-5">
                <LoginBanner />
                <div className="w-1/2 login-div h-[480px] flex flex-col justify-between">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-6xl mb-6" />
                        <h2 className="text-2xl font-medium">Your password has been successfully reset</h2>
                        <p className='text-[#A09D9D] text-lg mt-2'>You can now log in using your new credentials</p>
                        <Link href="/login" className="bg-[#b88b1b] hover:bg-[#ad841a] text-white rounded-xl px-8 py-3 transition duration-300 w-full mt-12">
                            Return to Login
                        </Link>
                    </div>

                    <div className='pagination flex gap-3 justify-center items-center mt-8'>
                        <div className='w-[12px] h-[12px] bg-[#ddd9d9] rounded-full'></div>
                        <div className='w-[12px] h-[12px] bg-[#ddd9d9] rounded-full'></div>
                        <div className='w-[12px] h-[12px] bg-[#b88b1b] rounded-full'></div>
                        <div className='w-[12px] h-[12px] bg-[#ddd9d9] rounded-full'></div>
                    </div>
                </div>
            </div>
        </section>
    );
}