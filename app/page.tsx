"use client";

import Link from "next/link";
import { useAuth } from "@/src/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-hidden relative">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent opacity-60" />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center relative z-10 px-6">
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <Image 
            src="/FlexPay-colored-logo.svg" 
            alt="FlexPay Logo" 
            width={320}
            height={128}
            className="h-24 md:h-32 w-auto mb-16 drop-shadow-sm" 
            priority
          />
          
          <Link 
            href="/signup" 
            className="group relative px-10 py-4 bg-[#10367D] text-white rounded-full font-black text-lg shadow-[0_20px_50px_rgba(16,54,125,0.2)] hover:shadow-[0_25px_60px_rgba(16,54,125,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
          </Link>
        </div>
      </main>

      <footer className="w-full p-8 text-center text-gray-300 text-[10px] font-bold uppercase tracking-[0.3em] relative z-10">
        &copy; 2026 PayFlex Technology Limited
      </footer>
    </div>
  );
}
