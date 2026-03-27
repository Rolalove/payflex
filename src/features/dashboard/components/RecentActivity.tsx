"use client";

import React, { useState } from "react";
import { useNotifications } from "@/src/hooks/useNotifications";
import { timeAgo, formatCurrency } from "@/src/utils/format";
import { ActivitySkeleton } from "@/src/components/ui/Skeleton";
import { LuCircleCheck, LuWallet, LuShieldCheck, LuZap } from "react-icons/lu";

import { EmptyActivityView } from "./EmptyActivityView";

interface RecentActivityProps {
  variant?: 'full' | 'simple';
}

export function RecentActivity({ variant = 'full' }: RecentActivityProps) {
  const { notifications, isLoading } = useNotifications('activity');
  const [showAll, setShowAll] = useState(false);

  // Limit to 3 by default
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3);

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment': return <LuWallet size={18} className="text-blue-500" />;
      case 'success': return <LuCircleCheck size={18} className="text-green-500" />;
      case 'alert': return <LuZap size={18} className="text-amber-500" />;
      default: return <LuShieldCheck size={18} className="text-[#10367D]" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-blue-50 border-blue-100';
      case 'success': return 'bg-green-50 border-green-100';
      case 'alert': return 'bg-amber-50 border-amber-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  if (isLoading) return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-foreground">Recent Activity</h2>
      <ActivitySkeleton />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-foreground">Recent Activity</h2>
        {notifications.length > 3 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-[#10367D] text-sm font-medium hover:underline transition-all"
          >
            {showAll ? 'Show less' : 'View all'}
          </button>
        )}
      </div>

      <div className="bg-[#f9f9f9] rounded-3xl p-2 min-h-[100px]">
        {notifications.length === 0 ? (
          variant === 'simple' ? (
            <div className="py-12 text-center text-gray-400">
              <p className="text-sm font-medium">No recent activity</p>
            </div>
          ) : (
            <EmptyActivityView />
          )
        ) : (
          displayedNotifications.map((notif) => {
            const amount = notif.metadata?.amount;
            return (
              <div key={notif.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${getIconBg(notif.type)} group-hover:scale-110 transition-transform`}>
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900 mb-0.5">{notif.title}</p>
                    <p className="text-[12px] text-gray-500 flex items-center gap-1.5">
                      {notif.message.length > 45 ? `${notif.message.substring(0, 45)}...` : notif.message}
                      <span className="text-[10px] text-gray-300">•</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight">{timeAgo(notif.created_at)}</span>
                    </p>
                  </div>
                </div>
                {amount && (
                  <div className="text-[15px] font-bold tracking-tight text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    + {formatCurrency(amount)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
