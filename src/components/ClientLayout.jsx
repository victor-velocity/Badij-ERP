"use client";

import { useEffect } from "react";
import { startAuthTimeout, checkExistingTimeout } from "@/app/lib/auth-timeout";
import { createClient } from "@/app/lib/supabase/client";

export default function ClientLayout({ children, isLoggedIn }) {
  useEffect(() => {
    if (!isLoggedIn) return;

    checkExistingTimeout();
    startAuthTimeout();

    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem("lastActivity");
      }
    });

    return () => subscription?.unsubscribe();
  }, [isLoggedIn]);

  return (
    <>
      {children}

      <div
        id="inactivity-modal"
        className="fixed inset-0 bg-[#000000aa] items-center justify-center z-[9999] hidden"
        style={{ display: "none" }}
      >
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Are you still there?
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your session will expire in{" "}
            <span
              id="countdown"
              data-seconds="60"
              className="font-bold text-3xl text-red-600"
            >
              60
            </span>{" "}
            seconds due to inactivity.
          </p>
          <button
            id="stay-logged-in-btn"
            className="bg-[#b88b1b] hover:bg-[#92701b] text-white font-semibold py-3 px-10 rounded-lg transition duration-200 transform hover:scale-105"
          >
            Stay Logged In
          </button>
        </div>
      </div>

      <style jsx global>{`
        .show-inactivity-modal #inactivity-modal {
          display: flex !important;
        }
        #countdown::after {
          content: attr(data-seconds);
        }
      `}</style>
    </>
  );
}