"use client";

import React, { useEffect, useState } from 'react';
import { LuCopy, LuCircleCheck, LuShieldCheck, LuCircleAlert } from 'react-icons/lu';
import { supabase } from '@/src/utils/supabase/client';
import Link from 'next/link';

export default function GuestPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = React.use(params);
  const token = resolvedParams.token;
  const [participant, setParticipant] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .rpc('get_transaction_by_token', { token_uuid: token });

        if (error) throw error;
        console.log("Fetched guest payment data:", data);
        if (!data || data.length === 0) throw new Error("Link invalid or expired");

        const record = data[0];
        const newTransaction = {
          id: record.transaction_id,
          type: record.type,
          status: record.status,
          title: record.title,
          target_amount: record.target_amount,
          current_amount: record.current_amount
        };
        const newParticipant = {
          id: record.participant_id,
          name: record.participant_name,
          email: record.participant_email,
          amount_owed: record.participant_amount_owed,
          amount_paid: record.participant_amount_paid
        };

        setTransaction(newTransaction);
        setParticipant(newParticipant);
        
        if (newParticipant.amount_paid >= newParticipant.amount_owed && newParticipant.amount_owed > 0) {
          setHasPaid(true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [token]);

  const handleMarkAsPaid = async () => {
    setIsPaying(true);
    try {
      // 1. Update participant status
      const { error: updateError } = await supabase
        .from('transaction_participants')
        .update({ 
          amount_paid: participant.amount_owed,
          paid_at: new Date().toISOString()
        })
        .eq('id', participant.id);

      if (updateError) throw updateError;

      setHasPaid(true);
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to confirm payment. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-pulse text-[#10367D] font-medium">Loading payment details...</div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-4xl p-8 max-w-md w-full text-center shadow-xl border border-red-50">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <LuCircleAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-500 mb-8">{error || "This link is no longer valid."}</p>
          <Link href="/" className="inline-block bg-[#10367D] text-white px-8 py-3 rounded-full font-bold hover:bg-blue-900 transition-all">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const isEscrow = transaction.type === 'Escrow';

  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Brand Logo */}
        <div className="text-center">
           <div className="inline-flex items-center gap-2 mb-2">
             <div className="w-8 h-8 bg-[#10367D] rounded-lg"></div>
             <span className="text-2xl font-bold text-[#10367D] tracking-tight">FlexPay</span>
           </div>
           <p className="text-gray-500 text-sm font-medium">Secure Payments & Escrow</p>
        </div>

        {hasPaid ? (
          <div className="bg-white rounded-5xl p-10 text-center shadow-2xl border border-blue-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <LuCircleCheck size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Received!</h2>
            <p className="text-gray-500 mb-4 px-4">Thank you, {participant.name || 'Participant'}. Your contribution of ₦{participant.amount_owed.toLocaleString()} to "{transaction.title}" has been confirmed.</p>
            <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-mono text-gray-900">{transaction.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date Paid</span>
                <span className="text-gray-900 font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">Funds are held securely by FlexPay.</p>
            
            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col items-center">
              <div className="bg-[#f0f7ff] rounded-3xl p-6 w-full text-left mb-6 border border-blue-50">
                <h4 className="text-[#10367D] font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-[#10367D] rounded-lg flex items-center justify-center text-white text-[10px]">FP</span>
                  Make your own splits?
                </h4>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                  Join <span className="font-bold">FlexPay</span> to manage your own shared bills, track expenses, and use secure escrow for your services.
                </p>
                <Link 
                  href={`/signup?email=${encodeURIComponent(participant.email || '')}`}
                  className="w-full inline-flex items-center justify-center bg-[#10367D] text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
                >
                  Sign up for Free
                </Link>
              </div>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Powered by FlexPay</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-5xl shadow-2xl border border-blue-50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#10367D]"></div>
            
            <div className="p-8 md:p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${isEscrow ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {transaction.type} INVITE
                  </span>
                  <h1 className="text-2xl font-bold text-gray-900 mt-3 leading-tight">{transaction.title}</h1>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">DUE AMOUNT</p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    <span className="text-lg font-medium">₦</span>{participant.amount_owed.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                  <p className="text-[10px] font-bold text-[#10367D] mb-4 uppercase tracking-widest">PAYMENT INSTRUCTIONS</p>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Transfer exactly <span className="font-bold text-gray-900">₦{participant.amount_owed.toLocaleString()}</span> to the account below.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-bold text-gray-900">Interswitch</span>
                    </div>
                    <div className="h-px bg-blue-100/50"></div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">1039488785</span>
                        <button className="p-1.5 bg-white rounded-lg border border-blue-100 text-[#10367D] hover:bg-blue-50 transition-colors">
                          <LuCopy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-2 text-xs text-gray-400 font-medium">
                  <LuShieldCheck size={18} className="text-green-500" />
                  <span>Funds are protected by FlexPay Escrow until delivery.</span>
                </div>

                <button 
                  onClick={handleMarkAsPaid}
                  disabled={isPaying}
                  className={`w-full py-5 rounded-3xl text-lg font-bold text-white shadow-lg shadow-blue-200/50 transition-all active:scale-95 ${isPaying ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#10367D] hover:bg-blue-900'}`}
                >
                  {isPaying ? 'Confirming...' : 'I Have Transferred'}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Facing issues? <a href="#" className="text-[#10367D] font-bold hover:underline">Chat with Support</a>
              </p>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center px-8">
           <p className="text-[10px] text-gray-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest font-bold">
             FlexPay Nigeria Ltd. Licensed by CBN as a Payment Solution Provider.
           </p>
        </div>
      </div>
    </div>
  );
}
