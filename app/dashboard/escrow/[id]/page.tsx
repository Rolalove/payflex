"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LuExternalLink, LuCopy, LuCircleCheck, LuBanknote, LuHourglass, LuLock, LuLoader, LuShieldCheck } from 'react-icons/lu';
import { supabase } from '@/src/utils/supabase/client';
import { handlePayment } from '@/src/components/ui/InterswitchCheckout';
import { DetailsSkeleton } from '@/src/components/ui/Skeleton';

export default function EscrowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof (window as any).webpayCheckout === 'function') {
      setIsScriptLoaded(true);
      return;
    }
    const check = setInterval(() => {
      if (typeof (window as any).webpayCheckout === 'function') {
        setIsScriptLoaded(true);
        clearInterval(check);
      }
    }, 500);
    return () => clearInterval(check);
  }, []);

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
        console.error("Error fetching escrow details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) return <DetailsSkeleton />;
  if (!transaction) return <div className="p-8 text-center text-red-500">Escrow not found.</div>;

  const { title, target_amount: amount, status, transaction_participants: participants, created_at } = transaction;
  const client = participants.find((p: any) => p.role_type === 'client') || { name: "Unknown", email: "" };
  const provider = participants.find((p: any) => p.role_type === 'provider') || { name: "Unknown", email: "" };

  const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : '?');
  const dateStr = new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium text-foreground">Escrow Details</h2>
          <div className="flex items-center gap-2 text-sm text-primary font-medium mt-1">
            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="hover:underline cursor-pointer">Escrow</span>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-900">{title}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Amount and Roles Card */}
          <div className="bg-[#f2f4f7] rounded-3xl p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-gray-500 tracking-wide uppercase mb-3">TOTAL AMOUNT HELD</p>
                <h3 className="text-xl font-medium text-gray-900 mb-1">{title}</h3>
                <div className="text-[26px] font-medium text-gray-900 tracking-tight flex items-baseline gap-1">
                  <span className="text-xl font-medium">₦</span> {parseFloat(amount).toLocaleString()}
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <LuExternalLink size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm bg-amber-400`}>
                  {getInitial(client.name)}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium mb-0.5">Client</p>
                  <p className="font-medium text-gray-900 text-sm leading-tight">{client.name}</p>
                  <p className="text-[11px] text-gray-500">{client.email || 'Invite Sent'}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm bg-blue-300`}>
                  {getInitial(provider.name)}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-medium mb-0.5">Service Provider</p>
                  <p className="font-medium text-gray-900 text-sm leading-tight">{provider.name}</p>
                  <p className="text-[11px] text-gray-500">{provider.email || 'Invite Sent'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-[#f2f4f7] rounded-3xl p-6">
            <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:ml-[1.45rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-gray-300 before:to-transparent">
              
              <div className="relative z-10">
                <div className="absolute -left-10 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white -translate-x-1.5 ring-4 ring-[#f2f4f7]">
                  <LuCircleCheck size={14} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Escrow Created</h4>
                  <p className="text-xs text-gray-500 mt-0.5 tracking-wide">₦ {parseFloat(amount).toLocaleString()} deposited. Both parties notified</p>
                </div>
              </div>
              
              <div className="relative z-10">
                  <div className={`absolute -left-10 w-6 h-6 rounded-full flex items-center justify-center text-white -translate-x-1.5 ring-4 ring-[#f2f4f7] ${status !== 'Awaiting Payment' ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <LuBanknote size={14} />
                  </div>
                  <div>
                    <h4 className={`font-medium text-sm ${status !== 'Awaiting Payment' ? 'text-gray-900' : 'text-gray-400'}`}>Money Secured</h4>
                  <p className="text-xs text-gray-500 mt-0.5 tracking-wide">Money held in FlexPay account</p>
                </div>
              </div>

              <div className="relative z-10">
                <div className={`absolute -left-10 w-6 h-6 rounded-full flex items-center justify-center text-white -translate-x-1.5 ring-4 ring-[#f2f4f7] ${status === 'Delivered' || status === 'Released' ? 'bg-green-500' : 'bg-gray-200'}`}>
                  <LuCircleCheck size={14} />
                </div>
                <div>
                  <h4 className={`font-medium text-sm ${status === 'Delivered' || status === 'Released' ? 'text-gray-900' : 'text-gray-400'}`}>Job Marked Complete</h4>
                  {status === 'Funds Held' && user?.id === provider.user_id && (
                    <button 
                      onClick={async () => {
                         const { error } = await supabase.from('transactions').update({ status: 'Delivered' }).eq('id', id);
                         if (!error) window.location.reload();
                      }}
                      className="bg-[#10367D] text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-blue-900 transition-colors mt-2"
                    >
                      Job Completed
                    </button>
                  )}
                </div>
              </div>

              <div className="relative z-10">
                <div className={`absolute -left-10 w-6 h-6 rounded-full border-2 flex items-center justify-center -translate-x-1.5 ring-4 ring-[#f2f4f7] ${status === 'Released' ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                  {status === 'Released' ? <LuCircleCheck size={14} /> : <LuHourglass size={12} />}
                </div>
                <div>
                  <h4 className={`font-medium text-sm ${status === 'Delivered' || status === 'Released' ? 'text-gray-900' : 'text-gray-400'}`}>Waiting for Client Approval</h4>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-sm leading-relaxed tracking-wide">
                    {status === 'Released' ? 'Funds have been released to the provider.' : 'Review the delivered work. If satisfied, approve release. If there\'s an issue, raise a dispute FlexPay will mediate.'}
                  </p>
                  {status === 'Delivered' && user?.id === client.user_id && (
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={async () => {
                          const { error } = await supabase.from('transactions').update({ status: 'Released' }).eq('id', id);
                          if (!error) window.location.reload();
                        }}
                        className="bg-[#10367D] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-blue-900 transition-colors shadow-sm"
                      >
                        Approve & Release ₦ {parseFloat(amount).toLocaleString()}
                      </button>
                      <button 
                        onClick={async () => {
                          const { error } = await supabase.from('transactions').update({ status: 'Dispute' }).eq('id', id);
                          if (!error) window.location.reload();
                        }}
                        className="bg-white border border-red-500 text-red-500 text-xs font-bold px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        Raise Dispute
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative z-10">
                <div className={`absolute -left-10 w-6 h-6 rounded-full flex items-center justify-center text-white -translate-x-1.5 ring-4 ring-[#f2f4f7] ${status === 'Released' ? 'bg-[#10367D]' : 'bg-gray-200'}`}>
                  <LuLock size={12} />
                </div>
                <div>
                  <h4 className={`font-medium text-sm ${status === 'Released' ? 'text-gray-900' : 'text-gray-400'}`}>Funds Released</h4>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {status === 'Awaiting Payment' && user?.id === client.user_id ? (
            <div className="bg-[#f0f4fd] border border-[#d6e4ff] rounded-3xl p-6 relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#10367D]/5 rounded-full -mr-12 -mt-12 blur-xl"></div>
              
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-[#10367D] mb-4 uppercase tracking-widest flex items-center justify-center gap-1.5">
                   <LuShieldCheck size={14} className="text-[#34A853]" />
                   SECURE CHECKOUT
                </p>
                <h3 className="text-2xl font-bold text-[#10367D] mb-1">₦ {parseFloat(amount).toLocaleString()}</h3>
                <p className="text-xs text-gray-500 mb-8 font-medium">Fund this Escrow securely with Interswitch.</p>
                
                <button 
                  onClick={() => {
                    const txnRef = `FP-ESCROW-${id.slice(0, 8)}-${Date.now()}`;
                    setIsPaying(true);
                    handlePayment({
                      amountNaira: amount,
                      payItemName: `Escrow: ${title}`,
                      txnRef,
                      participantId: client.id,
                      custEmail: user?.email || undefined,
                      onSuccess: async () => {
                        const { error } = await supabase.from('transactions').update({ status: 'Funds Held', current_amount: amount }).eq('id', id);
                        if (!error) window.location.reload();
                      },
                      onPending: () => {
                        alert('Bank processing. Please check back shortly.');
                        setIsPaying(false);
                      },
                      onFailure: (errorMsg) => {
                        alert(errorMsg || 'Payment failed.');
                        setIsPaying(false);
                      },
                    });
                  }}
                  disabled={isPaying || !isScriptLoaded}
                  className={`w-full py-3.5 rounded-full text-sm font-bold text-white shadow-xl shadow-blue-200/50 transition-all active:scale-[0.98] border-b-4 border-blue-900 flex items-center justify-center gap-2 ${isPaying || !isScriptLoaded ? 'bg-gray-400 cursor-not-allowed border-gray-500' : 'bg-[#10367D] hover:bg-blue-800'}`}
                >
                  {!isScriptLoaded && <><LuLoader size={16} className="animate-spin" /> Verifying...</>}
                  {isScriptLoaded && isPaying && <><LuLoader size={16} className="animate-spin" /> Processing...</>}
                  {isScriptLoaded && !isPaying && 'Pay with Interswitch'}
                </button>
              </div>
            </div>
          ) : status === 'Awaiting Payment' ? (
            <div className="bg-[#f0f4fd] border border-[#d6e4ff] rounded-3xl p-6 text-center">
              <LuHourglass className="mx-auto text-[#10367D] opacity-50 mb-3" size={24} />
              <h3 className="text-sm font-bold text-gray-900 mb-1">Awaiting Funds</h3>
              <p className="text-xs text-gray-500">Waiting for the client to fund this escrow.</p>
            </div>
          ) : (
             <div className="bg-[#e6f5ea] border border-[#bbf7d0] rounded-3xl p-6 text-center">
               <LuCircleCheck className="mx-auto text-green-500 mb-3" size={24} />
               <h3 className="text-sm font-bold text-gray-900 mb-1">Funds Secured</h3>
               <p className="text-xs text-gray-500">Monies are safely held in FlexPay Escrow.</p>
             </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-wide px-2">Escrow Details</h3>
            <div className="space-y-3 px-2">
              <div className="flex justify-between items-start pb-3 border-b border-gray-100 hover:bg-gray-50 transition-colors p-2 rounded-lg -mx-2">
                <span className="text-[13px] text-gray-400 font-medium">Service</span>
                <span className="text-[13px] font-medium text-gray-900 text-right max-w-[140px] leading-tight">{title}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 hover:bg-gray-50 transition-colors p-2 rounded-lg -mx-2">
                <span className="text-[13px] text-gray-400 font-medium">Total Amount</span>
                <span className="text-[13px] font-medium text-gray-900">₦ {parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 hover:bg-gray-50 transition-colors p-2 rounded-lg -mx-2">
                <span className="text-[13px] text-gray-400 font-medium">Status</span>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  {status}
                </div>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg -mx-2 hover:bg-gray-50 transition-colors">
                <span className="text-[13px] text-gray-400 font-medium">Created</span>
                <span className="text-[13px] font-medium text-gray-900">{dateStr}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
