"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "react-hot-toast";

const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
const WARNING_BEFORE_LOGOUT = 5 *  60 * 1000; // 1 minute before logout
const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours

export default function ClientLayout({ children }) {
  const [session, setSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState({ min: 1, sec: 0 });
  
  const supabase = createClient();

  const inactivityTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  /** Logout function */
  const logoutAndRedirect = useCallback(async (reason = "Session expired") => {
    clearAllTimers();
    localStorage.removeItem("lastActivity");
    localStorage.removeItem("lastLoginTime");

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Logout failed:", e);
    }

    toast.error(reason, { duration: 5000 });
    window.location.href = `/login?message=${encodeURIComponent(reason)}`;
  }, [supabase]);

  /** Clear timers */
  const clearAllTimers = () => {
    clearTimeout(inactivityTimeoutRef.current);
    clearTimeout(warningTimeoutRef.current);
    clearInterval(countdownIntervalRef.current);
  };

  /** Show inactivity modal with countdown */
  const showInactivityModal = useCallback(() => {
    setShowModal(true);

    let remainingSeconds = WARNING_BEFORE_LOGOUT / 1000;

    const updateCountdown = () => {
      const min = Math.floor(remainingSeconds / 60);
      const sec = remainingSeconds % 60;
      setCountdown({ min, sec });

      if (remainingSeconds <= 0) {
        clearInterval(countdownIntervalRef.current);
        logoutAndRedirect("Logged out due to inactivity");
      }

      remainingSeconds--;
    };

    updateCountdown();
    clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  }, [logoutAndRedirect]);

  /** Reset inactivity timer */
  const resetInactivityTimer = useCallback(() => {
    clearAllTimers();
    localStorage.setItem("lastActivity", Date.now().toString());

    warningTimeoutRef.current = setTimeout(showInactivityModal, WARNING_BEFORE_LOGOUT);
    inactivityTimeoutRef.current = setTimeout(
      () => logoutAndRedirect("Logged out due to inactivity"),
      INACTIVITY_TIMEOUT
    );
    setShowModal(false);
  }, [logoutAndRedirect, showInactivityModal]);

  /** Stay logged in handler */
  const handleStayLoggedIn = () => {
    resetInactivityTimer();
  };

  /** Track user activity */
  const startInactivityTracking = useCallback(() => {
    const events = ["mousemove", "keydown", "scroll", "touchstart", "click", "touchmove"];
    const handler = resetInactivityTimer;
    events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));

    resetInactivityTimer();

    return () => events.forEach((ev) => window.removeEventListener(ev, handler));
  }, [resetInactivityTimer]);

  /** Check 12-hour auto logout */
  const check12hAutoLogout = useCallback(() => {
    const lastLogin = localStorage.getItem("lastLoginTime");
    const now = Date.now();

    if (!lastLogin) {
      localStorage.setItem("lastLoginTime", now.toString());
      return;
    }

    if (now - parseInt(lastLogin) >= TWELVE_HOURS) {
      logoutAndRedirect("Session expired after 12 hours");
    }
  }, [logoutAndRedirect]);

  /** Initialize session */
  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) localStorage.setItem("lastLoginTime", Date.now().toString());
    };

    initSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) localStorage.setItem("lastLoginTime", Date.now().toString());
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);

  /** Start inactivity and 12-hour logout tracking */
  useEffect(() => {
    if (!session) return;
    const cleanupActivity = startInactivityTracking();
    check12hAutoLogout();
    const interval12h = setInterval(check12hAutoLogout, 5 * 60 * 1000); // every 5 min

    return () => {
      cleanupActivity?.();
      clearInterval(interval12h);
      clearAllTimers();
    };
  }, [session, startInactivityTracking, check12hAutoLogout]);

  return (
    <>
      {children}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl animate-pulse">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Are you still there?</h2>
            <p className="text-xl text-gray-700 mb-8">
              Session expires in
              <br />
              <span className="text-4xl font-black text-red-600 mt-4 inline-block">
                {countdown.min > 0 ? `${countdown.min} min` : `${countdown.sec} sec`}
              </span>
            </p>
            <button
              onClick={handleStayLoggedIn}
              className="bg-[#153087] hover:bg-[#faf714] hover:text-[black] text-white font-bold text-lg py-4 px-7 rounded-xl transition transform hover:scale-105 shadow-lg"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      )}
    </>
  );
}
