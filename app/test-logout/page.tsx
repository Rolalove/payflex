"use client";

import React, { useState } from "react";
import { LogoutModal } from "@/src/components/layout/LogoutModal";

export default function TestLogout() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <button 
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all font-bold"
      >
        Trigger Logout Modal
      </button>

      <LogoutModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        onConfirm={() => alert("Logged out!")} 
      />
    </div>
  );
}
