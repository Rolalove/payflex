"use client";

import React from "react";
import { LuLogOut, LuX } from "react-icons/lu";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop with enhanced blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Modal Content - Premium Glassmorphism Look */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-[2.5rem] w-full max-w-sm p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative z-10 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/20">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full transition-all duration-300"
        >
          <LuX size={20} />
        </button>

        <div className="text-center">
          <div className="relative w-20 h-20 bg-linear-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500 shadow-inner group overflow-hidden">
            <div className="absolute inset-0 bg-red-400/10 scale-0 group-hover:scale-105 transition-transform duration-500 rounded-full blur-2xl" />
            <LuLogOut size={36} className="relative z-10 animate-pulse-slow" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            See you soon?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-10 leading-relaxed max-w-[240px] mx-auto">
            Logging out will end your current session. You&apos;ll need to verify your account next time you visit.
          </p>

          <div className="flex flex-col gap-4">
            <button 
              onClick={onConfirm}
              className="w-full py-5 rounded-3xl font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-xl shadow-gray-200 dark:shadow-none transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Yes, Log Out</span>
              <LuLogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onClose}
              className="w-full py-5 rounded-3xl font-bold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 active:scale-95 border border-gray-100 dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
