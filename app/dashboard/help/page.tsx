"use client";

import React from 'react';
import { LuRocket } from 'react-icons/lu';

export default function HelpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-700 w-full">
      <div className="max-w-2xl w-full text-center px-6">
        
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
          Help Center <br/>
          <span className="text-[#10367D]">Coming Soon</span>
        </h1>
        
        <p className="text-lg text-gray-500 font-medium mb-12 leading-relaxed max-w-lg mx-auto">
          We&apos;re building a comprehensive support hub to help you flex your finances with confidence. 
          Stay tuned for tutorials, FAQs, and real-time support.
        </p>
      </div>
    </div>
  );
}
