"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/src/utils/supabase/client';
import { useAuth } from '@/src/providers/AuthProvider';
import { DetailsSkeleton } from '@/src/components/ui/Skeleton';
import { TransactionDetailsSidebar } from '@/src/features/dashboard/components/TransactionDetailsSidebar';
import { LuShieldCheck, LuLoader, LuCircleCheck, LuShare } from 'react-icons/lu';
import { SplitBillStepper } from '@/src/features/dashboard/components/SplitBillStepper';

declare global {
  interface Window {
    webpayCheckout: (request: any) => void;
  }
}

export default function SplitBillDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
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
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existingScript = document.getElementById('interswitch-inline-script');
    if (existingScript && (window as any).webpayCheckout) {
      setIsScriptLoaded(true);
      return;
    }
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'interswitch-inline-script';
      script.src = 'https://newwebpay.qa.interswitchng.com/inline-checkout.js';
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.body.appendChild(script);
    }
    const checkScript = setInterval(() => {
      if ((window as any).webpayCheckout) {
        setIsScriptLoaded(true);
        clearInterval(checkScript);
      }
    }, 1000);
    return () => clearInterval(checkScript);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`split-bill-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transaction_participants', filter: `transaction_id=eq.${id}` }, () => fetchData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter: `id=eq.${id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, fetchData]);

  const verifyPaymentOnServer = async (txnRef: string, amount: number) => {
    const MAX_ATTEMPTS = 5;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const res = await fetch(`/api/interswitch/verify-payment?txnRef=${txnRef}&amount=${amount}`);
        const data = await res.json();
        if (data.success) return { success: true };
        if (data.pending && attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        return { success: false, error: data.error };
      } catch (err) {
        if (attempt === MAX_ATTEMPTS) return { success: false, error: 'Network error' };
      }
    }
    return { success: false };
  };

  const handleInterswitchPay = (participant: any) => {
    console.log('[PAYMENT] Initiating for:', participant.name);
    
    if (!isScriptLoaded || !(window as any).webpayCheckout) {
      console.warn('[PAYMENT] Script not fully ready. Loaded:', isScriptLoaded);
      showToast("Payment system is still loading...", "error");
      return;
    }

    const amountInKobo = Math.round(participant.amount_owed * 100);
    const txnRef = `FP-SB-${id.slice(0, 8)}-${participant.id.slice(0, 8)}-${Date.now()}`;
    
    const request = {
      merchant_code: process.env.NEXT_PUBLIC_INTERSWITCH_MERCHANT_CODE || 'MX6072',
      pay_item_id: process.env.NEXT_PUBLIC_INTERSWITCH_PAY_ITEM_ID || '9405967',
      txn_ref: txnRef,
      amount: amountInKobo,
      currency: 566,
      cust_email: user?.email || 'customer@payflex.com',
      mode: 'TEST',
      onComplete: async (resp: any) => {
        console.log('[PAYMENT] Interswitch complete:', resp);
        setPayingId(participant.id);
        const result = await verifyPaymentOnServer(txnRef, amountInKobo);
        if (result.success) {
          await supabase.from('transaction_participants').update({ 
            amount_paid: participant.amount_owed, 
            paid_at: new Date().toISOString() 
          }).eq('id', participant.id);
          showToast("Payment confirmed!", "success");
          fetchData();
        } else {
          showToast(result.error || "Payment verification failed", "error");
        }
        setPayingId(null);
      },
    };

    console.log('[PAYMENT] Request payload:', request);
    try {
      (window as any).webpayCheckout(request);
    } catch (err) {
      console.error('[PAYMENT] Execution error:', err);
      showToast("Unexpected payment error", "error");
    }
  };

  const handleRelease = async () => {
    setReleasing(true);
    try {
      const { error } = await supabase.from('transactions').update({ status: 'Released' }).eq('id', id);
      if (error) throw error;
      showToast("Funds released!");
      fetchData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setReleasing(false);
    }
  };

  const handleDispute = async () => {
    if (!window.confirm("Dispute this transaction? This will freeze funds.")) return;
    try {
      const { error } = await supabase.from('transactions').update({ status: 'Disputed' }).eq('id', id);
      if (error) throw error;
      showToast("Dispute initiated", "error");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  if (isLoading) return <DetailsSkeleton />;
  if (!transaction) return <div className="p-8 text-center text-red-500">Not found.</div>;

  const { title, target_amount, current_amount, status, transaction_participants: participants } = transaction;
  const recipient = participants.find((p: any) => p.role_type === 'split_recipient') || { name: "Unknown" };
  const paidCount = participants.filter((p: any) => p.amount_paid >= p.amount_owed && p.amount_owed > 0).length;
  const totalCount = participants.filter((p: any) => p.amount_owed > 0).length;
  const progressPercent = target_amount > 0 ? Math.min((current_amount / target_amount) * 100, 100) : 0;
  const allPaid = paidCount === totalCount && totalCount > 0;
  
  const currP = participants.find((p: any) => p.user_id === user?.id);
  const isPaid = currP?.amount_paid >= currP?.amount_owed && currP?.amount_owed > 0;
  const isRecipient = currP?.role_type === 'split_recipient';

  const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : '?');

  return (
    <div className="animate-in fade-in duration-300">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl text-sm font-bold flex items-center gap-3 transition-all ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="mb-6 px-4 lg:px-0">
        <div className="text-[11px] font-bold text-[#10367D] uppercase tracking-widest hidden sm:block">
          Dashboard {'>'} Split Bill {'>'} <span className="text-gray-400">{title}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 bg-sidebar-bg p-2 sm:p-4 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem]">
        {/* Main Content Area */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Collected Progress Card */}
          <div className="bg-[#EBEBEB] rounded-4xl p-6 lg:p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter shadow-sm bg-white/50 px-3 py-1 rounded-full">COLLECTED</p>
              <button className="bg-white p-2 rounded-full shadow-sm hover:scale-110 transition-transform">
                <LuShare className="text-[#10367D]" size={18} />
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-0">
              <div>
                <h3 className="text-2xl lg:text-3xl font-black mb-3 text-gray-900 tracking-tight">{title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">₦</span>
                  <span className="text-4xl lg:text-5xl font-black tracking-tighter text-gray-900">{current_amount.toLocaleString()}</span>
                </div>
                <p className="text-[11px] font-bold text-gray-500 mt-3 flex items-center gap-2">
                  <span className="bg-white/60 px-2 py-0.5 rounded">OF ₦{target_amount.toLocaleString()}</span>
                  <span className="bg-[#10367D] text-white px-2 py-0.5 rounded">{paidCount}/{totalCount} PAID</span>
                </p>
              </div>
              
              <div className="flex flex-col items-start sm:items-end bg-white/40 p-3 rounded-2xl backdrop-blur-sm">
                <p className="text-[9px] text-gray-400 font-extrabold uppercase mb-2 tracking-widest">Recipient</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-white text-[11px] font-black shadow-inner border-2 border-white">
                    {getInitial(recipient.name)}
                  </div>
                  <span className="text-sm font-black text-gray-900 truncate max-w-[100px]">{recipient.name}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 h-2 w-full bg-white/30 rounded-full overflow-hidden">
               <div className="bg-[#10367D] h-full transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <SplitBillStepper status={status} />

          {/* Participants Table Section */}
          <div className="mt-10">
            <div className="overflow-x-auto lg:overflow-visible -mx-4 lg:mx-0 px-4 lg:px-0">
              <div className="min-w-[550px] lg:min-w-0">
                <div className="grid grid-cols-4 px-4 pb-4 border-b border-gray-100 mb-2">
                  {['PARTICIPANTS', 'AMOUNT', 'STATUS', 'ACTION'].map((h, i) => (
                    <div key={h} className={`text-[10px] font-black text-gray-400 tracking-widest ${i === 1 || i === 2 ? 'text-center' : i === 3 ? 'text-right' : ''}`}>
                      {h}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {participants.map((p: any, idx: number) => {
                    const pPaid = p.amount_paid >= p.amount_owed && p.amount_owed > 0;
                    const isR = p.role_type === 'split_recipient';
                    const colors = ['bg-[#FBBF24]', 'bg-[#60A5FA]', 'bg-[#F87171]', 'bg-[#34D399]', 'bg-[#A78BFA]'];
                    return (
                      <div key={idx} className="grid grid-cols-4 items-center py-4 px-4 hover:bg-white transition-all rounded-[1.25rem] group border border-transparent hover:border-gray-100 hover:shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-sm border-2 border-white ${colors[idx % 5]}`}>
                            {getInitial(p.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="font-bold text-[13px] text-gray-900 truncate block max-w-[120px]" title={p.name}>
                                {p.user_id === user?.id ? "You" : (p.name || 'User')}
                              </span>
                              {isR && <span className="bg-green-50 text-green-600 text-[8px] px-1.5 py-0.5 rounded-md font-black shrink-0">RECIPIENT</span>}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium truncate opacity-60">@{p.username || 'user'}</span>
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="bg-gray-50/80 rounded-full py-1.5 px-4 font-black text-[13px] text-gray-800 border border-gray-50 shadow-sm">
                            ₦ {p.amount_owed.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex justify-center">
                          {isR ? <span className="text-gray-300 text-[10px] font-bold">---</span> : (
                            <span className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tight ${pPaid ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}>
                              {pPaid ? 'PAID' : 'PENDING'}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-end">
                          {!pPaid ? (
                            p.user_id === user?.id ? (
                              <button 
                                onClick={() => handleInterswitchPay(p)} 
                                disabled={payingId === p.id} 
                                className="bg-[#10367D] text-white px-5 py-2 rounded-full text-[11px] font-black hover:bg-blue-900 transition-all shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
                              >
                                {payingId === p.id ? 'PROCESSING...' : 'PAY BILL'}
                              </button>
                            ) : (
                              <button className="border-2 border-[#10367D]/10 text-[#10367D] px-5 py-2 rounded-full text-[11px] font-black hover:bg-[#10367D] hover:text-white transition-all whitespace-nowrap">
                                REMIND
                              </button>
                            )
                          ) : (
                            isR && status === 'Action Needed' ? (
                              <button 
                                onClick={handleRelease} 
                                disabled={releasing} 
                                className="bg-green-600 text-white px-5 py-2 rounded-full text-[11px] font-black hover:bg-green-700 animate-bounce shadow-md whitespace-nowrap"
                              >
                                RELEASE FUND
                              </button>
                            ) : (
                              <div className="text-green-600 font-black text-[10px] flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                <LuCircleCheck size={14} /> SETTLED
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
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-[380px] shrink-0 space-y-6">
          {/* Main Action Callouts */}
          {status === 'Released' ? (
            <div className="bg-green-50 rounded-[2rem] p-8 border-2 border-green-100 shadow-sm">
              <div className="flex items-center gap-4 text-green-700 font-black mb-4">
                <LuCircleCheck size={28} /> <span className="text-xl tracking-tight">TRANSACTION SETTLED</span>
              </div>
              <p className="text-sm text-green-600 font-medium leading-relaxed">All funds have been collected and released successfully. The transaction is now closed.</p>
            </div>
          ) : status === 'Disputed' ? (
            <div className="bg-red-50 rounded-[2rem] p-8 border-2 border-red-100 shadow-sm">
               <div className="flex items-center gap-4 text-red-600 font-black mb-4">
                 <LuShieldCheck size={28} /> <span className="text-xl tracking-tight">UNDER DISPUTE</span>
               </div>
               <p className="text-sm text-red-600 font-medium leading-relaxed">This transaction has been frozen for safety review. Please contact support.</p>
               <button className="mt-6 w-full bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95 transition-all">Support Center</button>
            </div>
          ) : (
            <>
              {!isPaid && currP && (
                <div className="bg-gradient-to-br from-[#10367D] to-blue-900 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Pay Split Bill</h3>
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-8">Secured via Interswitch Escrow</p>
                  
                  <div className="flex justify-between items-end mb-8 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/60 font-bold uppercase">Your Contribution</span>
                      <span className="text-3xl font-black tracking-tighter transition-all group-hover:tracking-normal">₦ {currP.amount_owed.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleInterswitchPay(currP)} 
                    className="w-full bg-white text-[#10367D] py-4 rounded-2xl font-black shadow-lg hover:shadow-white/20 active:scale-[0.98] transition-all relative z-10"
                  >
                    PAY NOW
                  </button>
                </div>
              )}
              
              {isPaid && (
                <div className="bg-white rounded-[2rem] p-8 border-2 border-[#10367D]/5 shadow-sm">
                  <div className="flex items-center gap-4 text-[#10367D] font-black mb-3">
                    <LuCircleCheck size={24} className="text-green-500" /> 
                    <span className="text-lg tracking-tight">{allPaid ? 'TARGET REACHED!' : 'PAYMENT SUCCESS'}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 font-medium leading-relaxed">
                    {allPaid ? 'All participants have settled. The funds are now ready for release.' : 'Your contribution has been logged. We are waiting for other participants.'}
                  </p>
                  
                  {allPaid && isRecipient && (
                    <button 
                      onClick={handleRelease} 
                      disabled={releasing} 
                      className="mt-8 w-full bg-[#10367D] text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {releasing ? <LuLoader className="animate-spin" /> : 'RELEASE FUNDS NOW'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          <TransactionDetailsSidebar 
            id={id} 
            totalAmount={target_amount} 
            participantsCount={participants.length} 
            recipient={recipient} 
            status={status} 
            createdAt={transaction.created_at} 
            getInitial={getInitial}
            onDispute={handleDispute}
          />
        </div>
      </div>
    </div>
  );
}
