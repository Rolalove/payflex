"use client";

import React from 'react';
import { LuCopy } from 'react-icons/lu';

interface PaymentInstructionsProps {
  amountOwed: number;
  bankName?: string;
  accountNumber?: string;
  reference?: string;
}

export function PaymentInstructions({
  amountOwed,
  bankName = "Interswitch",
  accountNumber = "1029384756",
  reference = "FP-2048"
}: PaymentInstructionsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optional: add toast notification here
  };

  return (
    <div className="bg-[#E9F5FF] rounded-[2.5rem] p-8 border-[1.5px] border-[#10367D] relative overflow-hidden">
      <p className="text-[#10367D] text-[10px] font-bold mb-4">YOUR PAYMENT INSTRUCTIONS</p>
      <h3 className="text-2xl font-semibold text-gray-900 mb-2">Pay to FlexPay</h3>
      <p className="text-[13px] text-gray-400 font-medium mb-8 leading-relaxed">Make sure to send the <span className="text-gray-900">exact amount</span></p>
      
      <div className="space-y-5">
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-gray-400 font-medium font-sans italic">Bank</span>
          <span className="font-bold text-gray-900">{bankName}</span>
        </div>
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-gray-400 font-medium font-sans italic">Account Number</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-[15px]">{accountNumber}</span>
            <button 
              onClick={() => copyToClipboard(accountNumber)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 border border-gray-100 px-2 py-1 rounded-lg text-[10px] transition-colors"
            >
              <LuCopy size={12}/> Copy
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center text-[13px]">
          <span className="text-gray-400 font-medium font-sans italic">Reference</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-[15px]">{reference}</span>
            <button 
              onClick={() => copyToClipboard(reference)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 border border-gray-100 px-2 py-1 rounded-lg text-[10px] transition-colors"
            >
              <LuCopy size={12}/> Copy
            </button>
          </div>
        </div>
        <div className="pt-2 flex justify-between items-center border-t border-gray-50 mt-2">
          <span className="text-gray-400 font-medium font-sans italic">Your Amount</span>
          <span className="text-lg font-bold text-gray-900">₦ {amountOwed.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
