import React from 'react';

export default function Loading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="spinnerContainer">
                <div className="spinner"></div>
                <div className="loader">
                    <p>loading</p>
                    <div className="words">
                        <span className="word">cards</span>
                        <span className="word">data</span>
                        <span className="word">page</span>
                        <span className="word">resources</span>
                        <span className="word">contents</span>
                    </div>
                </div>
            </div>
        </div>
    );
}