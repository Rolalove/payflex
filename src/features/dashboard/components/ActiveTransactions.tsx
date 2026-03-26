'use client'
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/utils/supabase/client";
import { TransactionSkeleton, DetailsSkeleton } from "@/src/components/ui/Skeleton";

export function ActiveTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            transaction_participants(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();

    // Set up realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <TransactionSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-[#f2f4f7] rounded-3xl p-8 text-center">
        <p className="text-gray-500 font-medium">No active transactions yet.</p>
        <p className="text-xs text-gray-400 mt-1">Create a split bill or escrow to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-foreground">Active Transactions</h2>
        <button className="text-[#10367D] text-sm font-medium hover:underline">View all</button>
      </div>

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
    </div>
  );
}
