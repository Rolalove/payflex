"use client";

import React, { useState, useEffect } from 'react';
import { LuX, LuChevronDown, LuCircleCheck, LuCopy } from 'react-icons/lu';
import { supabase } from '@/src/utils/supabase/client';
import { useRouter } from 'next/navigation';

export function CreateEscrowModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'client' | 'provider' | ''>('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [partner, setPartner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdTxId, setCreatedTxId] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const router = useRouter();

  const resetForm = () => {
    setStep(1);
    setRole('');
    setTitle('');
    setAmount('');
    setPartner('');
    setSelectedPartner(null);
    setCreatedTxId('');
    setInviteToken('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    async function fetchRecent() {
      const { data } = await supabase.rpc('get_recent_participants');
      if (data) setRecentContacts(data);
    }
    if (isOpen) fetchRecent();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create Transaction
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'Escrow',
          status: 'Awaiting Payment',
          title: title || 'Website Redesign for ParaFunds',
          target_amount: parseFloat(amount || '0'),
          current_amount: 0,
          creator_id: user.id
        })
        .select()
        .single();
        
      if (txError) throw txError;

      // 2. Add Participants
      const participants = [
        {
          transaction_id: tx.id,
          user_id: user.id,
          name: user.user_metadata?.full_name || 'You',
          email: user.email,
          role_type: role,
          amount_owed: role === 'client' ? parseFloat(amount || '0') : 0,
          amount_paid: 0,
        },
        {
          transaction_id: tx.id,
          user_id: selectedPartner?.id || null,
          name: selectedPartner?.full_name || partner,
          email: selectedPartner?.email || (partner.includes('@') ? partner : null),
          role_type: role === 'client' ? 'provider' : 'client',
          amount_owed: role === 'client' ? 0 : parseFloat(amount || '0'),
          amount_paid: 0,
        }
      ];

      const { data: insertedParts, error: partError } = await supabase
        .from('transaction_participants')
        .insert(participants)
        .select();
 
      if (partError) throw partError;
 
      const partnerPart = insertedParts.find(p => p.user_id === null);
      if (partnerPart) {
        console.log("[INVITE] Triggering manual email for escrow partner");
        supabase.functions.invoke('send-invite', {
          body: partnerPart
        }).catch(err => console.error("[INVITE] Error triggering escrow invite:", err));
        
        setInviteToken(partnerPart.invite_token);
      }
      
      setCreatedTxId(tx.id);
      setStep(4);
    } catch (err) {
      console.error(err);
      alert('Error creating Escrow');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setPartner(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Privacy: Only search if it's a handle (@) or looks like an email
    const isSpecialSearch = query.startsWith('@') || query.includes('@');
    if (!isSpecialSearch) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, username')
      .or(`username.ilike.${cleanQuery}%,email.ilike.${cleanQuery}%`)
      .limit(5);
    
    if (!error && data) {
      setSearchResults(data);
    }
    setIsSearching(false);
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const selectPartner = (p: any) => {
    setSelectedPartner(p);
    setPartner(p.full_name);
    setSearchResults([]);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="bg-[#f2f4f7] w-full max-w-xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] rounded-4xl p-8 relative shadow-2xl mx-4">
        <button 
          onClick={() => {
            resetForm();
            onClose();
          }} 
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-white rounded-full p-1 shadow-sm"
        >
          <LuX size={20} />
        </button>

        <h2 className="text-[22px] font-medium text-center mb-6 text-gray-900">Create Escrow</h2>
        
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 mb-8 text-[11px] font-medium">
          <div className="flex flex-col items-center w-16">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${step >= 1 ? 'bg-[#10367D]' : 'bg-gray-300'}`}>1</div>
            <span className={step >= 1 ? 'text-gray-900' : 'text-gray-400'}>Role</span>
          </div>
          <div className={`w-14 h-px -mt-6 ${step >= 2 ? 'bg-[#10367D]' : 'bg-gray-300'}`}></div>
          <div className="flex flex-col items-center w-16">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${step >= 2 ? 'bg-[#10367D]' : 'bg-gray-300'}`}>2</div>
            <span className={step >= 2 ? 'text-gray-900' : 'text-gray-400'}>Details</span>
          </div>
          <div className={`w-14 h-px -mt-6 ${step >= 3 ? 'bg-[#10367D]' : 'bg-gray-300'}`}></div>
          <div className="flex flex-col items-center w-16 text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 ${step >= 3 ? 'bg-[#10367D] border-[#10367D] text-white' : 'text-[#10367D] border-gray-300'}`}>3</div>
            <span className={step >= 3 ? 'text-gray-900' : 'text-gray-400'}>Review</span>
          </div>
        </div>

        {/* Step 1: Role */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="block text-[15px] text-gray-900 mb-4 font-medium tracking-tight">Select Role</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setRole('client')}
                  className={`flex-1 p-5 rounded-2xl text-left border-2 transition-all shadow-sm ${role === 'client' ? 'bg-[#f0f6ff] border-[#b0cfff]' : 'bg-white border-transparent'}`}
                >
                  <p className="font-semibold text-[15px] mb-2 text-gray-900 tracking-tight">Client</p>
                  <p className="text-[13px] text-gray-400 font-medium leading-relaxed">I am paying for a service, I deposit and release funds</p>
                </button>
                <button 
                  onClick={() => setRole('provider')}
                  className={`flex-1 p-5 rounded-2xl text-left border-2 transition-all shadow-sm ${role === 'provider' ? 'bg-[#f0f6ff] border-[#b0cfff]' : 'bg-white border-transparent'}`}
                >
                  <p className="font-semibold text-[15px] mb-2 text-gray-900 tracking-tight">Service Provider</p>
                  <p className="text-[13px] text-gray-400 font-medium leading-relaxed">I am delivering a service and receive funds on approval</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-wide uppercase">HOW THIS WORKS</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#10367D] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                  <p className="text-[13px] font-medium text-gray-900 leading-tight">You deposit funds &rarr; secured in FlexPay escrow account</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#10367D] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                  <p className="text-[13px] font-medium text-gray-900 leading-tight">Provider completes the work and marks it as delivered</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#10367D] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                  <p className="text-[13px] font-medium text-gray-900 leading-tight">You review and approve &rarr; funds released immediately</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#10367D] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</div>
                  <p className="text-[13px] font-medium text-gray-900 leading-tight">Dispute? FlexPay mediates, no one loses unfairly</p>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleNext}
                disabled={!role}
                className={`w-full py-4 rounded-full font-semibold transition-all ${role ? 'bg-[#10367D] text-white hover:bg-blue-900 hover:shadow-md' : 'bg-[#e0e0e0] text-gray-400'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-[15px] text-gray-900 mb-2 font-medium tracking-tight">Add Service / Project Type</label>
              <input 
                type="text" 
                placeholder="E.g. Website Redesign of ParaFunds" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-[#10367D]/20 outline-none placeholder:text-gray-300 font-medium shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[15px] text-gray-900 mb-2 font-medium tracking-tight">Escrow Amount</label>
              <div className="w-full bg-white rounded-2xl py-4 px-5 flex items-center gap-3 shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-[#10367D]/20">
                <span className="font-semibold text-gray-900">₦</span>
                <input 
                  type="number" 
                  placeholder="00.00" 
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-transparent border-none text-[15px] focus:outline-none placeholder:text-gray-300 font-medium"
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-[15px] text-gray-900 mb-2 font-medium tracking-tight">{role === 'client' ? 'Add Service Provider' : 'Add Client'}</label>
              <div className="w-full bg-white rounded-2xl py-2 px-2 flex items-center shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-[#10367D]/20 min-h-[56px]">
                {selectedPartner ? (
                  <div className={`flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-2.5 ml-2 mr-2 border ${selectedPartner.id ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${selectedPartner.id ? 'bg-blue-600' : 'bg-amber-500'}`}>
                      {selectedPartner.id ? (selectedPartner.full_name?.charAt(0) || 'U') : 'G'}
                    </div>
                    <span className={`text-xs font-semibold tracking-tight ${selectedPartner.id ? 'text-[#10367D]' : 'text-amber-700'}`}>{selectedPartner.full_name}</span>
                    {!selectedPartner.id && <span className="text-[9px] text-amber-500 font-bold ml-1 uppercase underline underline-offset-2">Guest</span>}
                    <button onClick={() => setSelectedPartner(null)} className={`${selectedPartner.id ? 'text-blue-400 hover:text-blue-600' : 'text-amber-400 hover:text-amber-600'} ml-1`}><LuX size={12}/></button>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Search by name or email" 
                    value={partner}
                    onChange={e => handleSearch(e.target.value)}
                    className="w-full bg-transparent border-none py-2 px-3 text-[14px] focus:outline-none placeholder:text-gray-300 font-medium"
                  />
                )}
              </div>

              {/* Search Dropdown ONLY */}
              {searchResults.length > 0 && !selectedPartner && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <p className="text-[10px] font-bold text-gray-400 px-4 py-2 bg-gray-50 border-b border-gray-50 uppercase tracking-widest">
                    SEARCH RESULTS
                  </p>
                  {searchResults.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => selectPartner(user)}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {user.full_name?.charAt(0) || user.email.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{user.full_name || 'Anonymous'}</p>
                        <p className="text-[11px] text-gray-500">{user.email}{user.username ? ` (@${user.username})` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Contacts: Integrated Horizontal UI */}
              {partner.length === 0 && recentContacts.length > 0 && !selectedPartner && (
                <div className="mt-3 animator-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Recent Contacts</p>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentContacts.map(user => (
                      <div 
                        key={user.id}
                        onClick={() => selectPartner(user)}
                        className="flex flex-col items-center gap-1.5 min-w-[64px] cursor-pointer group"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#10367D] font-bold border-2 border-transparent group-hover:border-[#10367D] group-hover:bg-white transition-all shadow-sm">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium truncate w-16 text-center">{user.full_name?.split(' ')[0] || user.username || 'User'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!isSearching && partner.length >= 2 && searchResults.length === 0 && !selectedPartner && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 text-center">
                  {!validateEmail(partner) ? (
                    <p className="text-xs text-gray-500">
                      Search by @handle or valid email. <br />
                      <span className="text-[10px] text-gray-400 font-medium">Invitation links are sent to the email provided.</span>
                    </p>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedPartner({ full_name: partner, email: partner, id: null });
                        setSearchResults([]);
                      }}
                      className="w-full text-left p-4 hover:bg-amber-50 transition-colors group"
                    >
                      <p className="text-xs text-amber-600 font-bold group-hover:text-amber-700 uppercase tracking-tight">Add "{partner}" as Guest Participant</p>
                      <p className="text-[10px] text-amber-400 mt-1 font-medium">Click to confirm guest invitation</p>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-4">
              <button 
                onClick={handleBack}
                className="w-1/3 py-4 rounded-full font-semibold bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                disabled={!title || !partner || !amount}
                className={`w-2/3 py-4 rounded-full font-semibold transition-all ${title && partner && amount ? 'bg-[#10367D] text-white hover:bg-blue-900 hover:shadow-md' : 'bg-[#e0e0e0] text-gray-400'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{title || 'Website Redesign for ParaFunds'}</h3>
            
            <div className="flex items-center justify-between bg-white rounded-t-2xl p-4 border-b border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Total Amount Held in Escrow</span>
              <span className="font-semibold text-gray-900">₦ {parseFloat(amount || '115000').toLocaleString()}</span>
            </div>
            
            <div className="bg-white rounded-b-2xl p-4 shadow-sm space-y-4 -mt-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-white font-medium text-[13px] shadow-sm">
                    G
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm leading-tight">{role === 'client' ? 'You' : partner || 'Gideon Gabriel'}</p>
                    <p className="text-xs text-gray-500">@{role === 'client' ? 'You' : partner ? partner.toLowerCase().replace(' ', '') : 'Gideon232'}</p>
                  </div>
                </div>
                <span className="bg-[#e6f5ea] text-green-600 text-[10px] px-3 py-1 rounded-full font-bold tracking-wide">Client</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-300 flex items-center justify-center text-white font-medium text-[13px] shadow-sm">
                    B
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm leading-tight">{role === 'provider' ? 'You' : partner || 'Bolu Adeleke'}</p>
                    <p className="text-xs text-gray-500">@{role === 'provider' ? 'You' : partner ? partner.toLowerCase().replace(' ', '') : 'Bolu123'}</p>
                  </div>
                </div>
                <span className="bg-[#eef4ff] text-blue-600 text-[10px] px-3 py-1 rounded-full font-bold tracking-wide">Service Provider</span>
              </div>
            </div>
            
            <div className="pt-4 flex gap-4">
              <button 
                onClick={handleBack}
                className="w-1/3 py-4 rounded-full font-semibold bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleCreate}
                disabled={isLoading}
                className="w-2/3 py-4 rounded-full font-semibold bg-[#10367D] text-white hover:bg-blue-900 hover:shadow-md transition-all flex justify-center items-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : 'Create Escrow'}
              </button>
            </div>
          </div>
        )}
        {/* Step 4: Success */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 text-center py-4">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
              <LuCircleCheck size={40} />
            </div>
                     <h3 className="text-2xl font-bold text-gray-900 mb-2">Invitation Email Sent!</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
              We've sent an invitation email to your partner with a secure link to join PayFlex and participate in this escrow transaction.
            </p>

            <div className="pt-8 space-y-3">
              <button 
                onClick={() => {
                  onClose();
                  router.push(`/dashboard/escrow/${createdTxId}`);
                }}
                className="w-full py-4 rounded-full font-bold bg-[#10367D] text-white hover:bg-blue-900 transition-all"
              >
                Go to Details
              </button>
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-full font-bold text-gray-500 hover:text-gray-700 transition-all text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
