"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/utils/supabase/client';
import { useAuth } from '@/src/providers/AuthProvider';
import { TransactionSkeleton } from '@/src/components/ui/Skeleton';
import { formatCurrency, timeAgo } from '@/src/utils/format';
import { LuArrowUp, LuArrowDown, LuSearch, LuFilter, LuLayoutGrid, LuList } from 'react-icons/lu';
import Link from 'next/link';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);

      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_participants(*)')
        .order('created_at', { ascending: false });

      if (!error) setTransactions(data || []);
      setIsLoading(false);
    }
    fetchData();
  }, [user]);

  const stats = {
    totalIn: transactions.filter(tx => tx.creator_id === user?.id).reduce((sum, tx) => sum + tx.current_amount, 0),
    totalOut: transactions.filter(tx => tx.creator_id !== user?.id).reduce((sum, tx) => {
      const myPart = tx.transaction_participants?.find((p: any) => p.user_id === user?.id);
      return sum + (myPart?.amount_paid || 0);
    }, 0),
    pending: transactions.filter(tx => tx.status !== 'Released').length
  };

  const filteredTransactions = transactions.filter(tx => {
    const isOwner = tx.creator_id === user?.id;
    const matchesTab = activeTab === 'all' || (activeTab === 'inbound' && isOwner) || (activeTab === 'outbound' && !isOwner);
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (isLoading) return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />)}
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <TransactionSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-2xl text-green-600">
            <LuArrowDown size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Inbound Payouts</p>
            <p className="text-2xl font-black text-gray-900">₦ {stats.totalIn.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-4xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <LuArrowUp size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Outbound Payments</p>
            <p className="text-2xl font-black text-gray-900">₦ {stats.totalOut.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#10367D] p-6 rounded-4xl shadow-xl shadow-blue-100 flex items-center gap-4 text-white">
          <div className="bg-white/20 p-3 rounded-2xl">
            <LuFilter size={28} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Ongoing Deals</p>
            <p className="text-2xl font-black">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex bg-gray-50 p-1 rounded-2xl w-full md:w-auto">
          {(['all', 'inbound', 'outbound'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'bg-white text-[#10367D] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {tab.charAt(0) + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search payments..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-100 transition-all outline-none" 
          />
        </div>
      </div>

      {/* Ledger List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-4xl border-2 border-dashed border-gray-100 px-4">
            <p className="text-gray-400 font-medium font-sans">No transactions found matching your criteria.</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isOwner = tx.creator_id === user?.id;
            return (
              <Link 
                href={tx.type === 'Escrow' ? `/dashboard/escrow/${tx.id}` : `/dashboard/split-bill/${tx.id}`}
                key={tx.id} 
                className="bg-white p-4 md:p-6 rounded-3xl border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50/50 transition-all group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 md:gap-5 w-full sm:w-auto">
                  <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl flex items-center justify-center ${isOwner ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform`}>
                    {isOwner ? <LuArrowDown size={24} className="md:w-8 md:h-8" /> : <LuArrowUp size={24} className="md:w-8 md:h-8" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base md:text-[17px] font-bold text-gray-900 group-hover:text-[#10367D] transition-colors truncate">{tx.title}</h3>
                    <p className="text-[10px] md:text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">#{tx.id.slice(0, 8)}</span>
                      <span className="hidden xs:inline">•</span>
                      <span>{timeAgo(tx.created_at)}</span>
                      <span className="hidden xs:inline">•</span>
                      <span className={`px-2 py-0.5 rounded-full uppercase tracking-widest text-[8px] md:text-[9px] font-black ${tx.status === 'Released' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{tx.status}</span>
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto pl-16 sm:pl-0">
                  <p className="text-lg md:text-xl font-black text-gray-900">₦ {tx.target_amount.toLocaleString()}</p>
                  <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold">{tx.type} Transaction</p>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  );
}
