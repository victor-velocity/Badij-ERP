// app/login/page.js
"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-regular-svg-icons";
import LoginBanner from "@/components/LoginBanner";
import toast from "react-hot-toast";
import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCredentialErrorBox, setShowCredentialErrorBox] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const redirectToDashboard = async (user) => {
    const userRole = user?.app_metadata?.role;

    try {
      switch (userRole) {
        case 'hr_manager':
          router.push('/humanResources');
          break;
        case 'user':
          router.push('/employee');
          break;
        case 'manager':
          const { data: employeeData, error: employeeError } = await supabase
            .from('employees')
            .select("*")
            .eq('user_id', user.id)
            .single();

          if (employeeError) {
            console.error("Error fetching employee data:", employeeError);
            toast.error("Could not retrieve manager information");
            await supabase.auth.signOut();
            router.push('/login');
            return;
          } else {
            if (employeeData.department_id === "10d06661-6324-41e8-84d4-41917293e448") {
              router.push('/inventory')
            } else {
              toast.error("Could not retrieve manager information");
              await supabase.auth.signOut();
              router.push('/login');
            }
          }
          break;
        default:
          toast.error("Role not found. Try logging in again.")
          await supabase.auth.signOut();
          router.push('/login');
          break;
      }
    } catch (error) {
      console.error("Redirect error:", error);
      toast.error("An error occurred during login");
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await redirectToDashboard(user);
      }
    };
    checkUserSession();

    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [router, supabase]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsEmailInvalid(false);
    setIsPasswordInvalid(false);
    setShowCredentialErrorBox(false);

    let valid = true;

    if (!email.trim()) {
      setIsEmailInvalid(true);
      valid = false;
    }

    if (!password.trim()) {
      setIsPasswordInvalid(true);
      valid = false;
    }

    if (!valid) {
      toast.error("Please fill in email and password.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setShowCredentialErrorBox(true);
        toast.error(error.message || 'Login failed. Please check your credentials.');
      } else if (data.user) {
        toast.success("Successfully signed in!");
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        await redirectToDashboard(data.user);
      } else {
        setShowCredentialErrorBox(true);
        toast.error('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred during login");
    }

    setLoading(false);
  };

  return (
    <section className="flex justify-center items-center h-[100vh]">
      <div className="flex justify-center items-center flex-nowrap gap-7 w-full max-w-[1200px] banner-width p-5">
        <LoginBanner />
        <div className="w-1/2 login-div h-full">
          <h4 className="text-xl font-medium text-[#cd9e27]">Madison Jay</h4>
          <div className="my-4">
            <h2 className="text-2xl font-bold">Sign In</h2>
            <p className="text-[16px] text-[#878484]">
              Enter the field below to sign in to your account
            </p>
          </div>
          <div>
            <form onSubmit={handleLogin} className="mt-7">
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
                  setShowCredentialErrorBox(false);
                }}
                className={`border border-solid ${isEmailInvalid ? "border-red-500" : "border-[#DDD9D9]"
                  } p-2 text-sm rounded-lg w-full mt-2 mb-4 pr-10 focus:ring focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b]`}
              />
              <label htmlFor="password">
                Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder={showPassword ? "Enter Password" : "**********"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isPasswordInvalid) setIsPasswordInvalid(false);
                    setShowCredentialErrorBox(false);
                  }}
                  className={`border border-solid focus:ring focus:outline-none focus:ring-[#b88b1b] focus:border-[#b88b1b] ${isPasswordInvalid ? "border-red-500" : "border-[#DDD9D9]"
                    } p-2 text-sm rounded-lg w-full mt-2 mb-3 pr-10 `}
                />
                <span
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#A09D9D]"
                >
                  <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                </span>
              </div>

              <div className={`border border-solid border-[#ff3b30] mb-4 rounded-lg bg-[#FF3B300F] ${showCredentialErrorBox ? '' : 'hidden'
                }`}>
                <span className="font-medium text-[#FF3B30] text-[13px] px-2 py-3 flex justify-center items-center gap-2 flex-nowrap">
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>The email or password entered is incorrect. Please check your details and try again.</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center flex-nowrap gap-2">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    id="rememberMe"
                    className="cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-sm text-[#A09D9D] cursor-pointer"
                  >
                    Remember Me
                  </label>
                </div>
                <Link href="/forgot-password">
                  <p className="text-[#b88b1b] text-sm hover:text-[#b88b1b99] transition-all cursor-pointer">
                    Forgot Password?
                  </p>
                </Link>
              </div>
              <button
                type="submit"
                className={`${loading ? "bg-[#b88b1b99] cursor-not-allowed" : "bg-[#b88b1b] cursor-pointer hover:bg-[#ad841a]"} rounded-xl px-4 py-3 w-full mt-8 text-white`}
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}