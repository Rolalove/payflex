"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/src/utils/supabase/client';
import { LogoutModal } from './LogoutModal';
import { useState } from 'react'; // Added missing import for useState

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-48 rounded-2xl shrink-0 bg-sidebar-bg border-r border-sidebar-border h-full flex flex-col py-6">
      <div className="px-6 mb-12">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-1">
          Flex<span className="text-blue-500">Pay</span>
        </h1>
      </div>

      <div className="flex-1 flex justify-between flex-col gap-8">
        <div>
          <h2 className="px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Menu
          </h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/dashboard"
              className={`flex items-center gap-3 px-6 py-2.5 border-l-4 transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-blue-50/50 text-primary border-primary font-medium' 
                  : 'text-muted-foreground hover:bg-black/5 hover:text-foreground border-transparent'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              Dashboard
            </Link>
            <Link 
              href="/dashboard/payments"
              className={`flex items-center gap-3 px-6 py-2.5 border-l-4 transition-colors ${
                isActive('/dashboard/payments') 
                  ? 'bg-blue-50/50 text-primary border-primary font-medium' 
                  : 'text-muted-foreground hover:bg-black/5 hover:text-foreground border-transparent'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              Payments
            </Link>
            <Link 
              href="/dashboard/approvals"
              className={`flex items-center gap-3 px-6 py-2.5 border-l-4 transition-colors ${
                isActive('/dashboard/approvals') 
                  ? 'bg-blue-50/50 text-primary border-primary font-medium' 
                  : 'text-muted-foreground hover:bg-black/5 hover:text-foreground border-transparent'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              Approvals
            </Link>
          </nav>
        </div>

        <div>
          <h2 className="px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            General
          </h2>
          <nav className="flex flex-col gap-1">
            <Link 
              href="/dashboard/settings"
              className={`flex items-center gap-3 px-6 py-2.5 border-l-4 transition-colors ${
                isActive('/dashboard/settings') 
                  ? 'bg-blue-50/50 text-primary border-primary font-medium' 
                  : 'text-muted-foreground hover:bg-black/5 hover:text-foreground border-transparent'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Settings
            </Link>
            <Link 
              href="/dashboard/help"
              className="flex items-center gap-3 px-6 py-2.5 text-muted-foreground hover:bg-black/5 hover:text-foreground border-l-4 border-transparent transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Help
            </Link>
            <button 
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-3 px-6 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 border-l-4 border-transparent transition-colors mt-2 text-left w-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              Logout
            </button>
          </nav>
        </div>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogout} 
      />
    </aside>
  );
}
