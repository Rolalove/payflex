"use client";

import React from 'react';

interface TransactionDetailsSidebarProps {
  id: string;
  totalAmount: number;
  splitType?: string;
  participantsCount: number;
  recipient: {
    name: string;
  };
  status: string;
  createdAt: string;
  getInitial: (name: string) => string;
  onDispute?: () => void;
}

export function TransactionDetailsSidebar({
  id,
  totalAmount,
  splitType = "Equal",
  participantsCount,
  recipient,
  status,
  createdAt,
  getInitial,
  onDispute
}: TransactionDetailsSidebarProps) {
  return (
    <div className="bg-white/50 rounded-[2rem] p-8 space-y-8 shadow-sm">
      <div>
        <h4 className="text-[17px] font-bold text-gray-900 mb-6">Transaction Details</h4>
        <div className="space-y-5">
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-gray-400 font-medium">Payment ID</span>
            <span className="font-mono text-[12px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">#{id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-gray-400 font-medium">Total Amount</span>
            <span className="font-bold text-gray-900">₦ {totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-gray-400 font-medium">Split Type</span>
            <span className="bg-blue-50 text-[#10367D] px-3 py-1 rounded-full text-[11px] font-bold uppercase">{splitType}</span>
          </div>
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-gray-400 font-medium">Participants</span>
            <span className="font-bold text-gray-900">{participantsCount} Members</span>
          </div>
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-gray-400 font-medium">Created On</span>
            <span className="font-bold text-gray-900">
              {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between items-center text-[14px]">
            <span className="text-gray-400 font-medium">Status</span>
            <span className={`font-bold px-3 py-1 rounded-full text-[11px] uppercase ${
              status === 'Released' ? 'bg-green-100 text-green-700' : 
              status === 'Disputed' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {status !== 'Released' && status !== 'Disputed' && onDispute && (
        <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
          <button 
            onClick={onDispute}
            className="w-full text-red-500 hover:text-red-700 text-[13px] font-bold flex items-center justify-center gap-2 group transition-colors"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Report an Issue
          </button>
          <p className="text-[10px] text-gray-400 text-center leading-relaxed px-4">
            Report any discrepancies or fraudulent activity. Funds will be frozen during investigation.
          </p>
        </div>
      )}
    </div>
  );
}
