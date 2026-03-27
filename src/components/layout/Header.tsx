"use client";

import { usePathname } from "next/navigation";
import { FaArrowsRotate } from "react-icons/fa6";
import { useAuth } from "@/src/providers/AuthProvider";
import { NotificationBell } from "./NotificationBell";
import { LuMenu } from "react-icons/lu";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // Dynamic route to title mapping
  const getHeaderTitle = () => {
    if (pathname === '/dashboard') return "Overview";
    if (pathname === '/dashboard/payments') return "Payment Ledger";
    if (pathname === '/dashboard/approvals') return "Command Center";
    if (pathname === '/dashboard/help') return "Help Center";
    if (pathname.startsWith('/dashboard/settings')) return "Settings";
    if (pathname.startsWith('/dashboard/split-bill/')) return "Split Bill Details";
    if (pathname.startsWith('/dashboard/escrow/')) return "Escrow Details";
    return "Dashboard";
  };

  return (
    <header className="h-20 border-b bg-sidebar-bg border-border flex items-center justify-between rounded-2xl px-4 md:px-8 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-muted-foreground hover:bg-black/5 rounded-xl transition-colors"
        >
          <LuMenu size={24} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{getHeaderTitle()}</h1>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            <span>Last updated 24/03/2026</span>
            <button className="text-blue-500 hover:text-blue-600">
              <FaArrowsRotate size={12}/>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative hidden md:block">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-4 py-2 bg-white/50 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64 transition-all"
          />
        </div>

        <NotificationBell />

        <div className="flex items-center gap-3 pl-2 border-l border-border h-8">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 w-16 md:w-24 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
            </div>
          ) : (
            <>
              <div className="relative group cursor-pointer">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 group-hover:ring-[#10367D] transition-all">
                  <img 
                    src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}`} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-bold text-gray-900 leading-none">{user?.user_metadata?.full_name?.split(" ")[0] || "User"}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
