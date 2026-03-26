"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/src/utils/supabase/client';
import { DetailsSkeleton } from '@/src/components/ui/Skeleton';
import { PaymentInstructions } from '@/src/features/dashboard/components/PaymentInstructions';
import { TransactionDetailsSidebar } from '@/src/features/dashboard/components/TransactionDetailsSidebar';

export default function SplitBillDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const { data: tx, error } = await supabase
          .from('transactions')
          .select('*, transaction_participants(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setTransaction(tx);
      } catch (err) {
        console.error("Error fetching split bill details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) return <DetailsSkeleton />;
  if (!transaction) return <div className="p-8 text-center text-red-500">Split Bill not found.</div>;

  const { title, target_amount: totalAmount, current_amount: collectedAmount, status, transaction_participants: participants } = transaction;
  const recipient = participants.find((p: any) => p.role_type === 'split_recipient') || { name: "Unknown" };
  const paidCount = participants.filter((p: any) => p.amount_paid >= p.amount_owed && p.amount_owed > 0).length;
  const totalCount = participants.filter((p: any) => p.amount_owed > 0).length;

  const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : '?');

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6">
        <div className="text-[11px] font-bold text-[#10367D] uppercase tracking-[0.2em] mb-3">Dashboard {'>'} Split Bill {'>'} {title}</div>
      </div>

      <div className="flex flex-col lg:flex-row gap-20 bg-sidebar-bg">
        {/* Main Content Area */}
        <div className="flex-1 max-w-4xl space-y-8">
          
          {/* Progress Card (Hero) */}
          <div className="bg-[#f2f4f7] rounded-[2.5rem] p-8 lg:p-10 relative">
            <button className="absolute top-8 right-8 text-[#10367D] hover:text-blue-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-6">TOTAL AMOUNT COLLECTED</p>
                <h3 className="text-[22px] font-medium text-gray-900 mb-2">{title}</h3>
                <div className="text-[44px] font-semibold text-gray-900 tracking-tighter flex items-center gap-2">
                  <span className="text-2xl font-medium -mt-4 font-sans">₦</span> 
                  {collectedAmount.toLocaleString()}
                </div>
                <div className="mt-2 text-[13px] font-medium text-gray-400">
                  of <span className="text-gray-900 font-semibold">{totalAmount.toLocaleString()}</span> • <span className="text-[#10367D]">{paidCount} of {totalCount}</span>
                </div>
              </div>

              <div className="bg-white/50 backdrop-blur-sm rounded-2xl py-3 px-5 flex items-center gap-3 border border-white/40 shadow-sm">
                <div className="flex flex-col items-end">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Recipient</p>
                  <span className="text-[15px] font-semibold text-gray-900">{recipient.name}</span>
                </div>
                <div className={`w-10 h-10 rounded-full ${recipient.avatarColor || 'bg-amber-400'} flex items-center justify-center text-white text-[15px] font-bold shadow-sm border-2 border-white`}>
                  {getInitial(recipient.name)}
                </div>
              </div>
            </div>
          </div>

          {/* Premium Stepper */}
            <div className="bg-white/40 backdrop-blur-sm rounded-[2rem] px-8 py-6 flex items-center justify-between relative">
              <div className="flex flex-col items-center relative z-10 gap-2">
                <div className="w-10 h-10 rounded-full bg-[#34A853] flex items-center justify-center text-white shadow-lg shadow-green-100 ring-4 ring-green-100/50">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Create Split</span>
              </div>
              
              <div className="flex-1 h-[2px] mx-2 -mt-6 bg-[#34A853]/30">
                <div className={`h-full ${status === 'Collecting' ? 'w-1/2 bg-[#34A853]' : 'w-full bg-[#34A853]'}`}></div>
              </div>

              <div className="flex flex-col items-center relative z-10 gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${status === 'Collecting' ? 'bg-white text-[#34A853] ring-4 ring-white shadow-green-100 border-2 border-[#34A853]' : 'bg-[#34A853] text-white shadow-green-100 ring-4 ring-green-100/50'}`}>
                   {status === 'Collecting' ? <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Collecting</span>
              </div>

              <div className="flex-1 h-[2px] mx-2 -mt-6 bg-gray-200">
                <div className={`h-full ${status === 'All paid' || status === 'Released' ? 'w-full bg-[#34A853]' : 'w-0'}`}></div>
              </div>

              <div className="flex flex-col items-center relative z-10 gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${status === 'Action Needed' || status === 'Released' ? 'bg-[#34A853] text-white shadow-green-100 ring-4 ring-green-100/50' : 'bg-white border-2 border-gray-100 text-gray-300 shadow-sm'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'Action Needed' || status === 'Released' ? 'text-gray-900' : 'text-gray-300'}`}>All paid</span>
              </div>

              <div className="flex-1 h-[2px] mx-2 -mt-6 bg-gray-200">
                <div className={`h-full ${status === 'Released' ? 'w-full bg-[#34A853]' : 'w-0'}`}></div>
              </div>

              <div className="flex flex-col items-center relative z-10 gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${status === 'Released' ? 'bg-[#34A853] text-white shadow-green-100 ring-4 ring-green-100/50' : 'bg-white border-2 border-gray-100 text-gray-300 shadow-sm'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'Released' ? 'text-gray-900' : 'text-gray-300'}`}>Release funds</span>
              </div>
            </div>

          {/* Participants Table */}
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-4 gap-4 px-4 pb-4 border-b border-gray-100 italic font-sans">
              <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">PARTICIPANTS</div>
              <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">AMOUNT</div>
              <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">STATUS</div>
              <div className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">ACTION</div>
            </div>

            <div className="space-y-4">
              {participants.map((p: any, idx: number) => {
                const isPaid = p.amount_paid >= p.amount_owed && p.amount_owed > 0;
                
                return (
                  <div key={idx} className="grid grid-cols-4 items-center gap-4 py-2 px-2 hover:bg-white rounded-3xl transition-all group">
                    <div className="col-span-1 flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[15px] font-bold shadow-sm ${p.role_type === 'split_recipient' ? 'bg-amber-400' : 'bg-blue-100 text-[#10367D]'}`}>
                        {getInitial(p.name)}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[15px] font-bold text-gray-900 leading-none">{p.name || 'Invited'}</span>
                          {p.role_type === 'split_recipient' && <span className="bg-[#E6F5EA] text-[#34A853] text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest whitespace-nowrap">Recipient</span>}
                          {!p.user_id && <span className="bg-[#eef4ff] text-[#10367D] text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest whitespace-nowrap">Invited</span>}
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium tracking-tight">@{p.username || (p.email ? p.email.split('@')[0] : 'user')}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <div className="bg-white rounded-2xl py-2 px-4 inline-flex items-center gap-1 shadow-sm border border-gray-50">
                        <span className="text-[11px] font-bold text-gray-900 font-sans">₦</span>
                        <span className="text-[14px] font-bold text-gray-900 tracking-tight">{p.amount_owed.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-1">
                      <span className={`text-[13px] font-bold ${isPaid ? 'text-[#34A853]' : 'text-amber-500'}`}>
                        {isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="col-span-1">
                      {/* Action logic based on role and status */}
                      {!isPaid ? (
                        p.user_id === user?.id ? (
                          <button 
                            onClick={async () => {
                              const { error } = await supabase
                                .from('transaction_participants')
                                .update({ amount_paid: p.amount_owed, paid_at: new Date().toISOString() })
                                .eq('id', p.id);
                              if (!error) window.location.reload();
                            }}
                            className="bg-[#10367D] text-white px-6 py-2.5 rounded-full text-[12px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-900 transition-all active:scale-95"
                          >
                            Pay Bill
                          </button>
                        ) : (
                          <button className="bg-white border-2 border-[#10367D] text-[#10367D] px-6 py-2 rounded-full text-[12px] font-bold hover:bg-blue-50 transition-all active:scale-95">
                            Remind
                          </button>
                        )
                      ) : (
                        p.role_type === 'split_recipient' && status === 'Action Needed' ? (
                          <button 
                            onClick={async () => {
                              const { error } = await supabase
                                .from('transactions')
                                .update({ status: 'Released' })
                                .eq('id', id);
                              if (!error) window.location.reload();
                            }}
                            className="bg-[#10367D] text-white px-6 py-2.5 rounded-full text-[12px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-900 transition-all active:scale-95"
                          >
                            Release Fund
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#34A853] font-bold text-[12px] px-4">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            Completed
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[380px] shrink-0 space-y-6">
          <PaymentInstructions 
            amountOwed={participants.find((p: any) => p.user_id === user?.id)?.amount_owed || 0}
          />

          <TransactionDetailsSidebar 
            id={id}
            totalAmount={totalAmount}
            participantsCount={participants.length}
            recipient={recipient}
            status={status}
            createdAt={transaction.created_at}
            getInitial={getInitial}
          />
        </div>
      </div>
    </div>
  );
}
