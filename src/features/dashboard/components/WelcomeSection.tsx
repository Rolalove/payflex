"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/utils/supabase/client";
import { CreateSplitBillModal } from "./CreateSplitBillModal";
import { CreateEscrowModal } from "@/src/features/escrow/components/CreateEscrowModal";

export function WelcomeSection() {
  const [user, setUser] = useState<any>(null);
  const [greeting, setGreeting] = useState("Good Morning");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
      setIsLoading(false);
    });

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          {isLoading ? (
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md mb-2"></div>
          ) : (
            <h2 className="text-2xl font-medium text-foreground">{greeting}, {user?.user_metadata?.full_name?.split(" ")[0] || "User"}</h2>
          )}
          <p className="text-sm text-primary font-medium mt-1">Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Split Bill
          </button>
          <button 
            onClick={() => setIsEscrowModalOpen(true)}
            className="border border-primary text-primary px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Escrow
          </button>
        </div>
      </div>

      <CreateSplitBillModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      <CreateEscrowModal 
        isOpen={isEscrowModalOpen} 
        onClose={() => setIsEscrowModalOpen(false)} 
      />
    </>
  );
}
