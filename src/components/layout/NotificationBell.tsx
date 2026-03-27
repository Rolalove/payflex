"use client";

import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/src/hooks/useNotifications";
import { timeAgo } from "@/src/utils/format";
import { LuBell, LuCheckCheck, LuInfo, LuX, LuCircleCheck, LuCircleAlert } from "react-icons/lu";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications('alert');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <LuCircleCheck className="text-green-500" />;
      case 'alert': return <LuCircleAlert className="text-amber-500" />;
      default: return <LuInfo className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 border border-border rounded-full text-foreground hover:bg-black/5 transition-all relative ${isOpen ? 'bg-black/5 border-primary/50' : ''}`}
      >
        <LuBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-border overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-sidebar-bg/50 backdrop-blur-sm sticky top-0">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-[10px] font-bold text-[#10367D] hover:underline flex items-center gap-1 uppercase tracking-wider"
              >
                <LuCheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto w-full custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-[#10367D] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-gray-400 font-medium">Loading alerts...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <LuBell className="text-gray-200 w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-900">All caught up!</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">No new alerts at the moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 relative group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                    onClick={() => !notif.is_read && markAsRead(notif.id)}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-tight mb-1 ${!notif.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{notif.message}</p>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50/50 border-t border-gray-50 text-center">
              <button className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
