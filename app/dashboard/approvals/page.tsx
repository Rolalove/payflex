"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase/client';
import { useAuth } from '@/src/providers/AuthProvider';
import { TransactionSkeleton } from '@/src/components/ui/Skeleton';
import { LuCircleCheck, LuLock, LuInfo, LuUser, LuZap } from 'react-icons/lu';
import Link from 'next/link';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [actions, setActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActions() {
      if (!user) return;
      setIsLoading(true);

      // Query transactions where action might be needed
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_participants(*)')
        .not('status', 'eq', 'Released')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Filter actions client-side for precision
        const actionable = data.filter(tx => {
          const myPart = tx.transaction_participants?.find((p: any) => p.user_id === user?.id);
          
          // Case 1: Split Bill contribution pending
          if (tx.type === 'Split Bill' && myPart && myPart.amount_paid < myPart.amount_owed) return true;
          
          // Case 2: Escrow Release needed (if I'm the buyer/creator)
          if (tx.type === 'Escrow' && tx.creator_id === user?.id && tx.status === 'Funds Held') return true;
          
          // Case 3: Action Needed status (general)
          if (tx.status === 'Action Needed') return true;

          return false;
        });
        setActions(actionable);
      }
      setIsLoading(false);
    }
    fetchActions();
  }, []);

  if (isLoading) return (
    <div className="p-8 space-y-6">
      <div className="h-10 w-48 bg-gray-100 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <TransactionSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-6 animate-bounce duration-[3000ms]">
            <LuCircleCheck size={48} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
          <p className="text-gray-400 text-sm max-w-xs text-center leading-relaxed font-sans">No pending approvals or releases at the moment. Your financial flows are clear.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {actions.map((tx) => {
            const isSplitPayload = tx.type === 'Split Bill';
            const myPart = tx.transaction_participants?.find((p: any) => p.user_id === user?.id);
            const isReleaseAction = tx.type === 'Escrow' && tx.creator_id === user?.id && tx.status === 'Funds Held';

           return (
              <div key={tx.id} className="bg-white p-6 md:p-8 rounded-4xl md:rounded-[2.5rem] border border-transparent hover:border-blue-100 shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all group relative overflow-hidden">
                {/* Decorative Background Icon */}
                <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                  <LuZap size={160} className="text-[#10367D]" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isReleaseAction ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isReleaseAction ? 'AWAITING RELEASE' : 'ACTION REQUIRED'}
                    </span>
                    <LuZap className="text-amber-400 group-hover:scale-125 transition-transform" size={20} />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#10367D] transition-colors">{tx.title}</h3>
                  <p className="text-[13px] text-gray-400 font-medium mb-8 leading-relaxed">
                    {isReleaseAction 
                      ? "The seller has fulfilled their part. Authorize the release of funds to complete the deal." 
                      : `You have a pending contribution of ₦ ${myPart?.amount_owed.toLocaleString()} due for this split.`}
                  </p>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-gray-50 mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        <LuUser size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Deal</p>
                        <p className="text-base font-black text-gray-900">₦ {tx.target_amount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <Link 
                      href={isSplitPayload ? `/dashboard/split-bill/${tx.id}` : `/dashboard/escrow/${tx.id}`}
                      className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-xs font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        isReleaseAction 
                          ? 'bg-green-600 text-white shadow-green-100 hover:bg-green-700' 
                          : 'bg-[#10367D] text-white shadow-blue-100 hover:bg-black'
                      }`}
                    >
                      {isReleaseAction ? <LuLock size={14} /> : <LuZap size={14} />}
                      {isReleaseAction ? 'Release Funds' : 'Pay Now'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
