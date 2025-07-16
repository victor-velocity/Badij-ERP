// src/components/Loading.jsx
"use client"

import React from 'react';
import Image from 'next/image';

export default function Loading() {
    return (
        <div className='flex justify-center items-center h-screen'>
            <Image
                src="/madisonjayng_logo.png"
                width={250}
                height={250}
                alt='madisonjay logo'
                priority
                className='zoomAnimation'
            />
        </div>
    );
}