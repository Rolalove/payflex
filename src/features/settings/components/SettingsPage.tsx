"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProfileSettings } from "./ProfileSettings";
import { BankSettings } from "./BankSettings";
import { LuUser, LuCreditCard } from "react-icons/lu";

export function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get("tab") === "bank" ? "bank" : "profile";

  const handleTabChange = (tab: "profile" | "bank") => {
    // Update URL without full refresh to stay consistent with deep linking
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Local title removed - managed by global Header */}

      <div className="bg-sidebar-bg border border-border rounded-3xl p-2 md:p-4 shadow-sm min-h-[600px] flex flex-col">
        {/* Tabs Navigation */}
        <div className="flex gap-2 border-b border-border/50 pb-4 px-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange("profile")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "profile" 
                ? "bg-white text-primary shadow-sm border border-border" 
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            <LuUser size={18} />
            Profile Details
          </button>
          <button
            onClick={() => handleTabChange("bank")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "bank" 
                ? "bg-white text-primary shadow-sm border border-border" 
                : "text-muted-foreground hover:bg-black/5"
            }`}
          >
            <LuCreditCard size={18} />
            Bank Account
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-4">
          {activeTab === "profile" ? (
            <ProfileSettings />
          ) : (
            <BankSettings />
          )}
        </div>
      </div>
    </div>
  );
}
