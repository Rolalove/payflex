"use client";

import { useEffect, useState } from "react";
import { FaArrowsRotate } from "react-icons/fa6";
import { supabase } from "@/src/utils/supabase/client";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
      setIsLoading(false);
    });
  }, []);

  return (
    <header className="h-20 border-b bg-sidebar-bg border-border flex items-center justify-between rounded-2xl px-8 z-10 sticky top-0">
      <div>
        <h1 className="text-2xl font-medium text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>Last updated 12/10/2025; 2:00am</span>
          <button className="text-blue-500 hover:text-blue-600">
            <FaArrowsRotate size={14}/>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-4 py-2  border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
          />
        </div>

        <button className="p-2 border border-border rounded-full text-foreground hover:bg-black/5 transition-colors relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        </button>

        <div className="flex items-center gap-3 pl-2">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="relative">
                <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-border">
                  <img 
                    src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}`} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <span className="text-sm font-medium">{user?.user_metadata?.full_name || "User"}</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
