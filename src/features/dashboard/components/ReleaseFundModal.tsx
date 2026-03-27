"use client";

import React, { useState } from "react";
import { LuBanknote, LuLoader, LuCircleCheck, LuX } from "react-icons/lu";
import { supabase } from "@/src/utils/supabase/client";

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

interface ReleaseFundModalProps {
  transactionId: string;
  amount: number;
  recipientUserId: string;
  onClose: () => void;
  onReleased: () => void;
}

export function ReleaseFundModal({
  transactionId,
  amount,
  recipientUserId,
  onClose,
  onReleased,
}: ReleaseFundModalProps) {
  const [bank, setBank] = useState<BankInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    async function fetchBankDetails() {
      const { data } = await supabase
        .from("profiles")
        .select("bank_name, bank_code, bank_account_number, bank_account_name, bank_verified")
        .eq("id", recipientUserId)
        .single();

      if (data?.bank_verified) {
        setBank({
          bankName: data.bank_name || "",
          bankCode: data.bank_code || "",
          accountNumber: data.bank_account_number || "",
          accountName: data.bank_account_name || "",
        });
      } else {
        setBank(null);
      }
      setLoading(false);
    }
    fetchBankDetails();
  }, [recipientUserId]);

  const handleRelease = async () => {
    if (!bank) return;
    setReleasing(true);
    setError("");

    try {
      const transactionRef = `PF-${transactionId.slice(0, 8).toUpperCase()}-${Date.now()}`;

      // 1. Call Interswitch transfer API
      const transferRes = await fetch("/api/interswitch/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          accountNumber: bank.accountNumber,
          bankCode: bank.bankCode,
          accountName: bank.accountName,
          narration: `PayFlex Split Bill Release - ${transactionId.slice(0, 8).toUpperCase()}`,
          transactionRef,
        }),
      });

      const transferData = await transferRes.json();
      const interswitchRef = transferData.reference || transactionRef;

      // 2. Log disbursement in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("payout_disbursements").insert({
        transaction_id: transactionId,
        recipient_profile_id: recipientUserId,
        amount,
        bank_name: bank.bankName,
        bank_code: bank.bankCode,
        account_number: bank.accountNumber,
        account_name: bank.accountName,
        status: transferRes.ok ? "processing" : "failed",
        interswitch_ref: interswitchRef,
      });

      // 3. Update transaction status to Released
      const { error: txError } = await supabase
        .from("transactions")
        .update({ status: "Released" })
        .eq("id", transactionId);

      if (txError) throw txError;

      setReleased(true);
      setTimeout(() => {
        onReleased();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <LuX size={20} />
        </button>

        {/* Success State */}
        {released ? (
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LuCircleCheck size={40} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Funds Released!</h3>
            <p className="text-gray-500 text-sm">
              ₦{amount.toLocaleString()} is being disbursed to {bank?.accountName}.
            </p>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#eef4ff] rounded-2xl flex items-center justify-center text-[#10367D]">
                <LuBanknote size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Release Funds</h3>
                <p className="text-sm text-gray-400">Confirm disbursement to recipient</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400 animate-pulse text-sm">
                Loading bank details...
              </div>
            ) : !bank ? (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                <p className="text-red-600 font-semibold text-sm mb-2">No verified bank account</p>
                <p className="text-red-400 text-xs">
                  The recipient has not verified their bank account yet. Ask them to go to
                  Settings → Bank to set it up before funds can be released.
                </p>
              </div>
            ) : (
              <>
                {/* Amount */}
                <div className="bg-[#f2f4f7] rounded-2xl p-5 mb-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Amount to Disburse
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    <span className="text-xl font-medium">₦</span>
                    {amount.toLocaleString()}
                  </p>
                </div>

                {/* Bank Details */}
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Recipient Bank Details
                  </p>
                  <div className="bg-[#f8faff] border border-blue-50 rounded-2xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bank</span>
                      <span className="font-semibold text-gray-900">{bank.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Number</span>
                      <span className="font-semibold text-gray-900">{bank.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Name</span>
                      <span className="font-semibold text-gray-900">{bank.accountName}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-medium mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 border border-gray-200 text-gray-600 px-6 py-3.5 rounded-2xl font-semibold hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRelease}
                    disabled={releasing}
                    className="flex-1 bg-[#10367D] text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-blue-900 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                  >
                    {releasing ? (
                      <>
                        <LuLoader size={16} className="animate-spin" />
                        Releasing...
                      </>
                    ) : (
                      "Confirm Release"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
