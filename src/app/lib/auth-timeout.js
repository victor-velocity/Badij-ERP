let timeoutId = null;
let warningTimeoutId = null;
let countdownInterval = null;

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 2 minutes
const WARNING_BEFORE_LOGOUT = 60 * 1000; // Show modal 60s before logout

const logoutAndRedirect = async () => {
  clearAllTimers();
  localStorage.removeItem("lastActivity");

  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  await supabase.auth.signOut();

  window.location.href = "/login?message=Session expired";
};

const clearAllTimers = () => {
  clearTimeout(timeoutId);
  clearTimeout(warningTimeoutId);
  clearInterval(countdownInterval);
};

const showWarningModal = () => {
  const modal = document.getElementById("inactivity-modal");
  const countdownEl = document.getElementById("countdown-text");
  if (!modal || !countdownEl) return;

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  let secondsLeft = 60;
  countdownEl.textContent = "1 min";

  countdownInterval = setInterval(() => {
    secondsLeft--;
    countdownEl.textContent = secondsLeft > 0 ? `${secondsLeft} sec` : "0 sec";
    if (secondsLeft <= 0) {
      clearInterval(countdownInterval);
      logoutAndRedirect();
    }
  }, 1000);

  const stayBtn = document.getElementById("stay-logged-in-btn");
  stayBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    resetTimer();
  });
};

export const resetTimer = () => {
  clearAllTimers();
  localStorage.setItem("lastActivity", Date.now().toString());

  warningTimeoutId = setTimeout(showWarningModal, WARNING_BEFORE_LOGOUT);
  timeoutId = setTimeout(logoutAndRedirect, INACTIVITY_TIMEOUT);
};

export const startAuthTimeout = () => {
  const events = ["mousemove","keydown","scroll","touchstart","click","touchmove"];
  events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
  resetTimer();
};

export const checkExistingTimeout = () => {
  const last = localStorage.getItem("lastActivity");
  if (!last || Date.now() - parseInt(last) > INACTIVITY_TIMEOUT) {
    logoutAndRedirect();
  } else {
    resetTimer();
  }
};
