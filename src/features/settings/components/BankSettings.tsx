"use client";

import { useState, useEffect } from "react";
import { BsBank } from "react-icons/bs";
import { LuCircleCheck, LuLoader } from "react-icons/lu";
import { supabase } from "@/src/utils/supabase/client";

interface BankOption {
  bankName: string;
  bankCode: string;
}

export function BankSettings() {
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankDetail, setBankDetail] = useState({
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
  });
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load banks list from Interswitch
  useEffect(() => {
    async function loadBanks() {
      try {
        const res = await fetch("/api/interswitch/banks");
        const data = await res.json();
        if (data.banks && data.banks.length > 0) {
          // Transform Interswitch response to match BankOption interface
          // Interswitch returns name and code, we need bankName and bankCode
          const transformedBanks = data.banks.map((bank: any) => ({
            bankName: bank.name,
            bankCode: bank.code,
          }));
          setBanks(transformedBanks);
        }
      } catch (error) {
        console.error("Failed to fetch banks from Interswitch:", error);
      }
    }
    loadBanks();
  }, []);

  // Load saved bank details from profile
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select(
          "bank_name, bank_code, bank_account_number, bank_account_name, bank_verified",
        )
        .eq("id", user.id)
        .single();

      if (data) {
        setBankDetail({
          bankName: data.bank_name || "",
          bankCode: data.bank_code || "",
          accountNumber: data.bank_account_number || "",
          accountName: data.bank_account_name || "",
        });
        setVerified(!!data.bank_verified);
      }
      setLoadingProfile(false);
    }
    loadProfile();
  }, []);

  // Validate saved bankCode against fetched banks
  useEffect(() => {
    if (banks.length > 0 && bankDetail.bankCode) {
      const isValidBank = banks.some((b) => b.bankCode === bankDetail.bankCode);
      if (!isValidBank) {
        console.warn(
          `Saved bankCode "${bankDetail.bankCode}" not found in current banks list. Clearing it.`,
        );
        setBankDetail((prev) => ({
          ...prev,
          bankCode: "",
          bankName: "",
          accountName: "",
        }));
        setVerified(false);
      }
    }
  }, [banks]);

  const handleVerify = async () => {
    if (!bankDetail.accountNumber || !bankDetail.bankCode) {
      setVerifyError("Please select a bank and enter your account number.");
      return;
    }

    // Verify that the selected bankCode exists in the fetched banks list
    const isValidBank = banks.some((b) => b.bankCode === bankDetail.bankCode);
    if (!isValidBank) {
      setVerifyError(
        "Selected bank is not valid. Please select a bank from the list.",
      );
      return;
    }

    if (bankDetail.accountNumber.length !== 10) {
      setVerifyError("Account number must be 10 digits.");
      return;
    }

    setVerifying(true);
    setVerifyError("");
    setVerified(false);

    try {
      const res = await fetch("/api/verify/identity/account-number/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountNumber: bankDetail.accountNumber,
          bankCode: bankDetail.bankCode,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.accountName) {
        setVerifyError(
          data.error || "Could not verify account. Check your details.",
        );
      } else {
        setBankDetail((prev) => ({ ...prev, accountName: data.accountName }));
        setVerified(true);
      }
    } catch {
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) {
      setVerifyError("Please verify your account number before saving.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const selectedBank = banks.find((b) => b.bankCode === bankDetail.bankCode);

    const { error } = await supabase
      .from("profiles")
      .update({
        bank_name: selectedBank?.bankName || bankDetail.bankName,
        bank_code: bankDetail.bankCode,
        bank_account_number: bankDetail.accountNumber,
        bank_account_name: bankDetail.accountName,
        bank_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (!error) {
      setSaveSuccess(true);
      setVerified(true);
    } else {
      setVerifyError("Error saving details: " + error.message);
    }
    setSaving(false);
  };

  if (loadingProfile) {
    return (
      <div className="p-8 text-center text-muted-foreground animate-pulse">
        Loading bank details...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-500">
      {/* Header Card */}
      <div className="bg-alert-bg border border-alert-border rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm">
        <div className="bg-[#10367D] p-3 rounded-full text-white shrink-0">
          <BsBank size={24} />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Payout Destination</h4>
          <p className="text-sm text-foreground/80 mt-1">
            This bank account will receive all funds from your split bills and
            escrow payments once they are released.
          </p>
        </div>
      </div>

      {/* Verified Badge */}
      {verified && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-semibold">
          <LuCircleCheck size={18} />
          Bank account verified — payouts enabled
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-semibold">
          <LuCircleCheck size={18} />
          Bank details saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bank Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Select Bank
          </label>
          <select
            value={bankDetail.bankCode}
            onChange={(e) => {
              const selected = banks.find((b) => b.bankCode === e.target.value);
              setBankDetail({
                ...bankDetail,
                bankCode: e.target.value,
                bankName: selected?.bankName || "",
                accountName: "",
              });
              setVerified(false);
              setSaveSuccess(false);
            }}
            className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Select a bank</option>
            {banks.map((b, index) => (
              <option key={`${b.bankCode}-${index}`} value={b.bankCode}>
                {b.bankName}
              </option>
            ))}
          </select>
        </div>

        {/* Account Number + Verify */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Account Number
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={bankDetail.accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setBankDetail({
                  ...bankDetail,
                  accountNumber: val,
                  accountName: "",
                });
                setVerified(false);
                setSaveSuccess(false);
              }}
              className="flex-1 bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="0123456789"
              maxLength={10}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={
                verifying || !bankDetail.accountNumber || !bankDetail.bankCode
              }
              className="px-5 py-3 bg-[#10367D] text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {verifying ? (
                <LuLoader size={16} className="animate-spin" />
              ) : null}
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </div>
          {verifyError && (
            <p className="text-[11px] text-red-500 font-medium">
              {verifyError}
            </p>
          )}
        </div>

        {/* Account Name (auto-filled after verification) */}
        {bankDetail.accountName && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Account Name
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={bankDetail.accountName}
                readOnly
                className="flex-1 bg-muted border border-border rounded-xl py-3 px-4 text-sm text-muted-foreground cursor-not-allowed"
              />
              {verified && (
                <LuCircleCheck size={20} className="text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Account name retrieved from Interswitch.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border mt-8">
          <button
            type="submit"
            disabled={saving || !verified}
            className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-900 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Saving..." : "Save Bank Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
