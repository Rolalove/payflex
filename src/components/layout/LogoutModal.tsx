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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-4xl w-full max-w-sm p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Confirm Logout</h3>
          <p className="text-gray-500 font-medium text-sm mb-10 leading-relaxed">
            Are you sure you want to log out? You&apos;ll need to log in again to access your dashboard.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onConfirm}
              className="w-full py-4 rounded-2xl font-black bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
            >
              Yes, Log Out
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-black bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              No, Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
