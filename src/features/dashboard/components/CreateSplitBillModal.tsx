"use client";

import React, { useState, useEffect } from 'react';
import { LuX, LuChevronDown } from 'react-icons/lu';
import { supabase } from '@/src/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  name: string;
  avatarLetter: string;
  avatarColor: string;
  amount: number;
  isRecipient?: boolean;
  isMember: boolean;
  email?: string;
}

export function CreateSplitBillModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [recipientId, setRecipientId] = useState<string>('');
  const [isRecipientDropdownOpen, setIsRecipientDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitees, setInvitees] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const resetForm = async () => {
    setStep(1);
    setTitle('');
    setTotalAmount('');
    setSplitType('equal');
    setRecipientId('');
    setNewParticipant('');
    setSearchResults([]);
    
    // Re-initialize participants with self
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setParticipants([{
          id: profile.id,
          name: profile.full_name || 'You',
          avatarLetter: (profile.full_name || 'Y').charAt(0).toUpperCase(),
          avatarColor: 'bg-[#10367D]',
          amount: 0,
          isMember: true,
          email: profile.email
        }]);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && participants.length === 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const self: Participant = {
            id: profile.id,
            name: profile.full_name || 'You',
            avatarLetter: (profile.full_name || 'Y').charAt(0).toUpperCase(),
            avatarColor: 'bg-[#10367D]',
            amount: 0,
            isMember: true,
            email: profile.email
          };
          setParticipants([self]);
          setRecipientId(''); // NO LONGER DEFAULT TO SELF
        }
      }

      // Fetch recent contacts
      const { data: recent } = await supabase.rpc('get_recent_participants');
      if (recent) setRecentContacts(recent);
    }
    if (isOpen) initUser();
  }, [isOpen]);

  useEffect(() => {
    if (splitType === 'equal' && participants.length > 0) {
      const total = parseFloat(totalAmount) || 0;
      const amountPerPerson = total / participants.length;
      setParticipants(prev => prev.map(p => ({ ...p, amount: amountPerPerson })));
    }
  }, [totalAmount, splitType, participants.length]);

  const handleSearch = async (query: string) => {
    setNewParticipant(query);
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

  const addParticipant = (userOrEmail: any, isMember: boolean) => {
    const isEmail = typeof userOrEmail === 'string' && userOrEmail.includes('@');
    
    // Check if we're adding someone already added
    const existing = participants.find(p => 
      (isMember && p.id === userOrEmail.id) || 
      (p.email && p.email === (isMember ? userOrEmail.email : userOrEmail))
    );
    if (existing) {
      setNewParticipant('');
      setSearchResults([]);
      return;
    }

    const newP: Participant = {
      id: isMember ? userOrEmail.id : `guest-${Date.now()}`,
      name: isMember ? userOrEmail.full_name : (isEmail ? userOrEmail : userOrEmail),
      avatarLetter: isMember ? (userOrEmail.full_name || userOrEmail.email).charAt(0).toUpperCase() : userOrEmail.charAt(0).toUpperCase(),
      avatarColor: isMember ? 'bg-blue-600' : 'bg-amber-400',
      amount: 0,
      isMember: isMember,
      email: isMember ? userOrEmail.email : (isEmail ? userOrEmail : null),
    };
    
    setParticipants([...participants, newP]);
    setNewParticipant('');
    setSearchResults([]);
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleAddParticipantKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newParticipant.trim()) {
      e.preventDefault();
      const input = newParticipant.trim();
      const isEmail = validateEmail(input);
      
      if (isEmail) {
        addParticipant(input, false);
      } else if (searchResults.length > 0) {
        addParticipant(searchResults[0], true);
      } else {
        // Only add as guest if it's a valid email or we really want to allow names
        if (input.includes(' ')) { // Simple check for full names if preferred
           addParticipant(input, false);
        }
      }
    }
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
    if (recipientId === id) setRecipientId('');
  };

  const handleCustomAmountChange = (id: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, amount: numValue } : p));
  };

  const isCustomValid = splitType === 'custom' ?
    Math.abs(participants.reduce((sum, p) => sum + p.amount, 0) - (parseFloat(totalAmount) || 0)) < 0.01 : true;

  const handleCreate = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create Transaction
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert({
          type: 'Split Bill',
          status: 'Collecting',
          title: title || 'Split Bill',
          target_amount: parseFloat(totalAmount || '0'),
          current_amount: 0,
          creator_id: user.id
        })
        .select()
        .single();
        
      if (txError) throw txError;

      const participantRecords = participants.map(p => {
        return {
          transaction_id: tx.id,
          user_id: p.isMember ? p.id : null,
          name: p.name,
          email: p.email,
          role_type: p.id === recipientId ? 'split_recipient' : 'split_member',
          amount_owed: p.amount,
          amount_paid: 0,
        };
      });

      const { data: insertedParts, error: partError } = await supabase
        .from('transaction_participants')
        .insert(participantRecords)
        .select();
 
      if (partError) throw partError;
 
      const invitedOnes = insertedParts.filter(p => p.user_id === null && p.amount_owed > 0);

      // 3. Trigger Invitation Emails for Guest Participants
      if (invitedOnes.length > 0) {
        console.log("[INVITE] Triggering manual emails for guests:", invitedOnes.length);
        // We don't await this to keep the UI snappy, but we fire the requests
        Promise.all(invitedOnes.map((guest: any) => 
          supabase.functions.invoke('send-invite', {
            body: guest
          })
        )).catch(err => console.error("[INVITE] Error triggering manual emails:", err));

        setInvitees(invitedOnes);
        setStep(4);
      } else {
        onClose();
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating Split Bill');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const recipient = participants.find(p => p.id === recipientId);

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

        <h2 className="text-[22px] font-medium text-center mb-6 text-gray-900">Create Split Bill</h2>
        
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 mb-8 text-[11px] font-medium">
          <div className="flex flex-col items-center w-16">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${step >= 1 ? 'bg-[#10367D]' : 'bg-gray-300'}`}>1</div>
            <span className={step >= 1 ? 'text-gray-900' : 'text-gray-400'}>Split Details</span>
          </div>
          <div className={`w-14 h-[1px] -mt-6 ${step >= 2 ? 'bg-[#10367D]' : 'bg-gray-300'}`}></div>
          <div className="flex flex-col items-center w-16">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${step >= 2 ? 'bg-[#10367D]' : 'bg-gray-300'}`}>2</div>
            <span className={step >= 2 ? 'text-gray-900' : 'text-gray-400'}>Add Amount</span>
          </div>
          <div className={`w-14 h-[1px] -mt-6 ${step >= 3 ? 'bg-[#10367D]' : 'bg-gray-300'}`}></div>
          <div className="flex flex-col items-center w-16">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 text-gray-400 mb-2 ${step >= 3 ? 'border-[#10367D] text-[#10367D]' : ''}`}>3</div>
            <span className={step >= 3 ? 'text-gray-900' : 'text-gray-400'}>Review</span>
          </div>
        </div>

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm text-gray-900 mb-2 font-medium">Bill Title</label>
              <input 
                type="text" 
                placeholder="E.g. Dinner at SoulFood" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white border-none rounded-2xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-[#10367D]/20 outline-none placeholder:text-gray-400 shadow-sm"
              />
            </div>
            
            <div className="relative">
              <label className="block text-sm text-gray-900 mb-2 font-medium">Add Participants (Type name or email)</label>
              <div className="w-full min-h-[56px] bg-white rounded-2xl p-2.5 text-sm flex flex-wrap gap-2 items-center cursor-text shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-[#10367D]/20">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center gap-1.5 bg-[#f4f4f5] rounded-full py-1 pl-1 pr-2 border border-gray-100">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-medium ${p.avatarColor}`}>{p.avatarLetter}</div>
                    <span className="text-[11px] text-gray-700 font-medium">{p.name}</span>
                    <button onClick={() => removeParticipant(p.id)} className="text-gray-400 hover:text-gray-600 ml-0.5"><LuX size={10}/></button>
                  </div>
                ))}
                <input 
                  type="text" 
                  placeholder="Type name..." 
                  value={newParticipant}
                  onChange={e => handleSearch(e.target.value)}
                  onKeyDown={handleAddParticipantKey}
                  className="flex-1 bg-transparent min-w-[150px] outline-none text-[13px] placeholder:text-gray-400 px-1" 
                />
              </div>

              {/* Search Dropdown ONLY */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <p className="text-[10px] font-bold text-gray-400 px-4 py-2 bg-gray-50 border-b border-gray-50 uppercase tracking-widest">
                    SEARCH RESULTS
                  </p>
                  {searchResults.map(user => (
                    <div 
                      key={user.id}
                      onClick={() => addParticipant(user, true)}
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
                  {validateEmail(newParticipant) && !searchResults.some(r => r.email === newParticipant) && (
                     <div 
                       onClick={() => addParticipant(newParticipant, false)}
                       className="flex items-center gap-3 p-3 hover:bg-amber-50 cursor-pointer border-t border-gray-50 transition-colors"
                     >
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 leading-tight">Add "{newParticipant}" as Guest Participant</p>
                          <p className="text-[11px] text-gray-400 font-medium">Link will be sent to this email</p>
                        </div>
                     </div>
                  )}
                </div>
              )}

              {/* Recent Contacts: Integrated Horizontal UI */}
              {newParticipant.length === 0 && recentContacts.length > 0 && (
                <div className="mt-3 animator-in slide-in-from-top-2 duration-300">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Recent Contacts</p>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentContacts.map(user => (
                      <div 
                        key={user.id}
                        onClick={() => addParticipant(user, true)}
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
              
              {!isSearching && newParticipant.length >= 2 && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 text-center">
                  {!newParticipant.includes('@') ? (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Only handles (@name) or emails are searchable for privacy.</p>
                      <p className="text-[10px] text-gray-400 font-medium">To invite a guest, please enter their full email address.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                       <p className="text-sm text-gray-500">No member found with that handle/email.</p>
                       <button 
                        onClick={() => addParticipant(newParticipant, false)}
                        className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600"
                      >
                        Invite {newParticipant} as Guest
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm text-gray-900 mb-2 font-medium">Add Fund Recipient</label>
              <div 
                className="w-full bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer border shadow-sm border-gray-100 hover:border-gray-200"
                onClick={() => setIsRecipientDropdownOpen(!isRecipientDropdownOpen)}
              >
                {recipient ? (
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${recipient.avatarColor} flex items-center justify-center text-white font-medium text-[13px]`}>{recipient.avatarLetter}</div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 leading-tight">{recipient.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 font-medium">Select a participant</div>
                )}
                <LuChevronDown className="w-5 h-5 text-gray-400" />
              </div>
              
              {isRecipientDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
                  {participants.length === 0 ? (
                    <div className="p-4 text-sm text-gray-500 text-center">Add participants first</div>
                  ) : (
                    participants.map(p => (
                      <div 
                        key={p.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setRecipientId(p.id);
                          setIsRecipientDropdownOpen(false);
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full ${p.avatarColor} flex items-center justify-center text-white font-medium text-[13px]`}>{p.avatarLetter}</div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-900 leading-tight">{p.name}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setStep(2)}
                disabled={!title || participants.length === 0}
                className={`w-full py-4 rounded-full font-semibold transition-all ${title && participants.length > 0 ? 'bg-[#10367D] text-white hover:bg-blue-900 hover:shadow-md' : 'bg-[#e0e0e0] text-gray-400'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Amount */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <label className="block text-sm text-gray-900 mb-2 font-medium">Total Amount</label>
              <div className="w-full bg-white rounded-2xl py-3.5 px-4 flex items-center gap-2 shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-[#10367D]/20">
                <span className="font-semibold text-gray-900">₦</span>
                <input 
                  type="number" 
                  placeholder="00.00" 
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  className="w-full bg-transparent border-none text-[15px] focus:outline-none placeholder:text-gray-300 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-900 mb-2 font-medium">Split Type</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => setSplitType('equal')}
                  className={`flex-1 p-3.5 rounded-[1.25rem] text-left border-[2px] transition-all bg-white shadow-sm ${splitType === 'equal' ? 'bg-[#f4f8ff] border-[#b0cfff]' : 'border-transparent'}`}
                >
                  <p className={`font-semibold text-[13px] mb-0.5 ${splitType === 'equal' ? 'text-[#10367D]' : 'text-gray-900'}`}>Equal Split</p>
                  <p className="text-[11px] text-gray-400 font-medium">Divide evenly among participants.</p>
                </button>
                <button 
                  onClick={() => setSplitType('custom')}
                  className={`flex-1 p-3.5 rounded-[1.25rem] text-left border-[2px] transition-all bg-white shadow-sm ${splitType === 'custom' ? 'bg-[#f4f8ff] border-[#b0cfff]' : 'border-transparent'}`}
                >
                  <p className={`font-semibold text-[13px] mb-0.5 ${splitType === 'custom' ? 'text-[#10367D]' : 'text-gray-900'}`}>Custom Split</p>
                  <p className="text-[11px] text-gray-400 font-medium">Manually assign amount to participants.</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-2 shadow-sm">
              <div className="space-y-0.5">
                {participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 rounded-[1.5rem] hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-[13px] shadow-sm ${p.avatarColor}`}>
                        {p.avatarLetter}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 text-[13px] leading-tight">
                            {p.name}
                          </p>
                          {p.id === recipientId && <span className="bg-[#e6f5ea] text-green-600 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Recipient</span>}
                          {!p.isMember && <span className="bg-[#eef4ff] text-blue-600 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wide">Invited</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-semibold text-gray-900">₦</span>
                      {splitType === 'equal' ? (
                        <div className="text-[13px] font-semibold text-gray-900 tracking-tight w-20 text-right">
                          {p.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={p.amount || ''}
                          onChange={e => handleCustomAmountChange(p.id, e.target.value)}
                          className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-right text-[13px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10367D]/20"
                          placeholder="0.00"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {splitType === 'custom' && !isCustomValid && totalAmount && (
                <div className="p-3 text-red-500 text-xs text-center font-medium">
                  Total custom amounts must equal ₦{totalAmount}
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-4">
              <button 
                onClick={() => setStep(3)}
                disabled={!totalAmount || (splitType === 'custom' && !isCustomValid)}
                className={`w-full py-4 rounded-full font-semibold transition-all ${totalAmount && (splitType === 'equal' || isCustomValid) ? 'bg-[#10367D] text-white hover:bg-blue-900 hover:shadow-md' : 'bg-[#e0e0e0] text-gray-400'}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Review */}
        {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center">
                    <p className="text-sm text-gray-500 mb-1">Total Bill</p>
                    <p className="text-3xl font-semibold text-gray-900">₦ {parseFloat(totalAmount).toLocaleString()}</p>
                </div>
                
                <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Bill Title</span>
                        <span className="font-medium text-gray-900">{title}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Split Type</span>
                        <span className="font-medium text-gray-900 capitalize">{splitType} Split</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Participants</span>
                        <span className="font-medium text-gray-900">{participants.length}</span>
                    </div>
                    {recipient && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Fund Recipient</span>
                            <span className="font-medium text-gray-900">{recipient.name}</span>
                        </div>
                    )}
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={handleCreate}
                    disabled={isLoading || !recipient}
                    className="w-full py-4 rounded-full font-semibold bg-[#10367D] text-white hover:bg-blue-900 hover:shadow-md transition-all flex items-center justify-center"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (participants.some(p => !p.isMember) ? 'Confirm & Send Invites' : 'Create Split Bill')}
                  </button>
                </div>
            </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 py-4">
             <div className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-[20px] font-bold text-gray-900 mt-6 tracking-tight">Invitation Emails Sent!</h3>
                <p className="text-gray-500 text-center mx-auto text-[13px] mt-2 mb-8 font-medium leading-relaxed max-w-[280px]">
                  Individual payment links have been sent to participants' emails. 
                  You can also copy the links below to share them manually.
                </p>
             </div>

             <div className="space-y-3 mt-6 text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">SHARE PAYMENT LINKS</p>
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 max-h-[240px] overflow-y-auto">
                   {invitees.map((inv, idx) => (
                     <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-gray-900">{inv.name}</span>
                           <span className="text-[10px] text-gray-400 font-medium">₦ {inv.amount_owed.toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/pay/${inv.invite_token}`);
                            alert(`Link for ${inv.name} copied!`);
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-[#10367D] bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                        >
                          Copy Link
                        </button>
                     </div>
                   ))}
                   {invitees.length === 0 && <p className="p-4 text-center text-gray-400 text-xs">No guest invites needed.</p>}
                </div>
             </div>

             <div className="pt-4 space-y-3">
                <button 
                  onClick={() => {
                    onClose();
                    router.push('/dashboard');
                  }}
                  className="w-full py-4 rounded-full font-bold bg-[#10367D] text-white hover:bg-blue-900 shadow-md shadow-blue-100 transition-all"
                >
                  Back to Dashboard
                </button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
