'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/utils/supabase/client";
import { formatCurrency, timeAgo } from "@/src/utils/format";
import { useAuth } from "@/src/providers/AuthProvider";
import { TransactionSkeleton, DetailsSkeleton } from "@/src/components/ui/Skeleton";
import { EmptyActivityView } from "./EmptyActivityView";

interface ActiveTransactionsProps {
  hideHeader?: boolean;
}

export function ActiveTransactions({ hideHeader = false }: ActiveTransactionsProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Derive consolidated loading state
  const isLoading = authLoading || (user && dataLoading);

  useEffect(() => {
    async function fetchTransactions() {
      if (!user) {
        return;
      }
      setDataLoading(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            transaction_participants(*)
          `)
          .order('created_at', { ascending: false });
          // Note: RLS handles the security filtering for creator/participant access.
          // We removed the complex .or filter and !inner join to avoid duplicate row issues
          // and ensure reliable fetching while RLS remains the source of truth.

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchTransactions();

    if (!user) return;

    // Set up targeted realtime subscription
    const channel = supabase
      .channel(`active-tx-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions' 
        },
        (payload) => {
          // If the change didn't involve our ID, we might skip it (though RLS should handle it)
          // For now, full refetch is fine but the channel is scoped.
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-medium text-foreground">Active Transactions</h2>
          {transactions.length > 0 && (
            <button className="text-[#10367D] text-sm font-medium hover:underline">View all</button>
          )}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="bg-[#f9f9f9] rounded-3xl p-2 min-h-[100px]">
          <EmptyActivityView />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transactions.map((tx) => {
            const isEscrow = tx.type === 'Escrow';
          const typeColor = isEscrow ? "bg-[#e6f5ea] text-green-600" : "bg-[#e5ecf6] text-[#10367D]";
          
          let statusColor = "text-amber-500";
          let dotColor = "bg-amber-400";
          if (tx.status === 'Released') {
            statusColor = "text-green-500";
            dotColor = "bg-green-400";
          } else if (tx.status === 'Action Needed' || tx.status === 'Dispute') {
            statusColor = "text-red-500";
            dotColor = "bg-red-500";
          } else if (tx.status === 'Funds Held') {
            statusColor = "text-[#10367D]";
            dotColor = "bg-[#10367D]";
          }

          const participants = tx.transaction_participants || [];
          const paidCount = participants.filter((p: any) => p.amount_paid >= p.amount_owed && p.amount_owed > 0).length;
          const totalCount = participants.filter((p: any) => p.amount_owed > 0).length;
          
          const subtitle = isEscrow 
            ? "In progress • Delivery awaited" 
            : `of ${tx.target_amount.toLocaleString()} • ${paidCount} of ${totalCount || 1}`;

          const progressValue = (tx.current_amount / tx.target_amount) * 100;
          const progressText = isEscrow ? `₦ ${tx.current_amount.toLocaleString()} HELD` : `₦ ${tx.current_amount.toLocaleString()} COLLECTED`;

          const avatars = participants.map((p: any) => ({
            letter: p.name ? p.name.charAt(0).toUpperCase() : '?',
            color: p.role_type === 'split_recipient' ? 'bg-amber-400' : 'bg-blue-300'
          })).slice(0, 4);

          if (participants.length > 4) {
            avatars.push({ letter: `+${participants.length - 3}`, color: 'bg-white text-gray-600 border border-gray-100' });
          }

          const detailHref = isEscrow ? `/dashboard/escrow/${tx.id}` : `/dashboard/split-bill/${tx.id}`;

          return (
            <Link href={detailHref} key={tx.id} className="bg-[#f2f4f7] rounded-3xl p-6 flex flex-col justify-between hover:shadow-sm hover:scale-[1.01] transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-6">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wide ${typeColor}`}>
                  {tx.type}
                </span>
                <div className={`flex items-center gap-1.5 text-[11px] font-medium ${statusColor}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                  {tx.status}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-gray-900 font-medium text-[15px] mb-1">{tx.title}</h3>
                <div className="text-[26px] font-medium text-gray-900 tracking-tight flex items-baseline gap-1 mb-1">
                  <span className="text-[16px] font-medium">₦</span> {tx.target_amount.toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">{subtitle}</p>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex -space-x-1.5">
                    {avatars.map((av: any, i: number) => (
                      <div 
                        key={i} 
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium border-2 border-[#f2f4f7] ${av.color}`}
                      >
                        {av.letter}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
                    <span className="font-bold text-[#10367D] mr-1">{progressText.split(" ")[0]} {progressText.split(" ")[1]}</span>
                    {progressText.split(" ").slice(2).join(" ")}
                  </div>
                </div>
                
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#10367D]" 
                    style={{ width: `${progressValue}%` }}
                  ></div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    )}
    </div>
  );
}
