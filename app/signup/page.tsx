"use client";
import { useEffect } from "react";
import Link from "next/link";
import { LuPhone, LuLock, LuEye } from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import { supabase } from "@/src/utils/supabase/client";
import { AuthLeftPanel } from "@/src/features/auth/components/AuthLeftPanel";

export default function SignupPage() {

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) console.error("Error logging in:", error.message);
    } catch (err) {
      console.error("Unknown auth error:", err);
    }
  };

  useEffect(() => {
    // Session checks can go here
  }, []);
  return (
    <div className="h-screen bg-[#ebebeb] flex justify-center p-4 lg:p-6">
      <div className="flex w-full max-w-[1200px] h-full bg-white lg:bg-transparent rounded-3xl shadow-sm lg:shadow-none overflow-hidden lg:overflow-visible">
        <AuthLeftPanel />

        {/* Right Panel */}
        <div className="flex-1 flex flex-col  px-8 lg:px-20 relative bg-[#ebebeb] lg:bg-transparent rounded-r-3xl">
          <div className="absolute  right-12 text-sm text-[#B7B6B6]">
            Already have an account? {" "}
            <Link href="/login" className="text-[#1A181B] font-semibold underline">
              Login
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto mt-16 lg:mt-0">
            <h2 className="text-3xl font-medium text-[#1A181B] mb-10 tracking-tight">Create your PayFlex account</h2>

            <form className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                  <LuPhone size={18} />
                </div>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="w-full bg-white border border-gray-100 rounded-full py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                  <LuLock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Enter password"
                  className="w-full bg-white border border-gray-100 rounded-full py-4 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <LuEye size={18} />
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#10367D] hover:bg-blue-900 text-white font-medium rounded-full py-4 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>

            <div className="flex items-center my-8">
              <div className="grow border-t border-[#B7B6B6]"></div>
              <span className="shrink-0 mx-4 text-[#1A181B] font-medium">or</span>
              <div className="grow border-t border-[#B7B6B6]"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-[#eef4ff] hover:bg-blue-50 text-[#1A181B] font-medium rounded-full py-4 flex items-center justify-center gap-2 transition-colors text-xl"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
          </div>

          <div className="text-center font-medium text-sm text-[#B7B6B6] mt-auto">
            By creating an account, you agree to PayFlex&apos;s{" "}
            <Link href="/terms" className="text-[#1A181B] font-medium border-b border-[#1A181B]">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#1A181B] font-medium border-b border-[#1A181B]">
              Privacy Policy
            </Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
