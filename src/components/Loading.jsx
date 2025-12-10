// src/components/Loading.jsx
"use client"

import React from 'react';
import Image from 'next/image';

export default function Loading() {
    return (
        <div className='flex justify-center items-center h-screen'>
            <Image
                src="/badij_logo.png"
                width={250}
                height={250}
                alt='Badij Logo'
                priority
                className='zoomAnimation'
            />
        </div>
    );
}