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
}

export function TransactionDetailsSidebar({
  id,
  totalAmount,
  splitType = "Equal",
  participantsCount,
  recipient,
  status,
  createdAt,
  getInitial
}: TransactionDetailsSidebarProps) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm space-y-6">
      <p className="text-[13px] font-bold text-gray-900 tracking-tight">Transaction Details</p>
      <div className="space-y-4">
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-400 font-medium">Transaction ID</span>
          <span className="font-bold text-gray-900 truncate ml-4">FX-{id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-400 font-medium">Total Amount</span>
          <span className="font-bold text-gray-900">₦ {totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-400 font-medium">Split Type</span>
          <span className="font-bold text-gray-900">{splitType}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-400 font-medium">Participants</span>
          <span className="font-bold text-gray-900">{participantsCount}</span>
        </div>
        <div className="flex justify-between items-center text-[12px]">
          <span className="text-gray-400 font-medium">Recipient</span>
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[9px] font-bold">{getInitial(recipient.name)}</div>
             <span className="font-bold text-gray-900">{recipient.name}</span>
          </div>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-400 font-medium">Status</span>
          <span className="font-bold text-amber-500 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            {status}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-gray-400 font-medium">Created</span>
          <span className="font-bold text-gray-900">
            {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
