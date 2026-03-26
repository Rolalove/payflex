"use client";

import { useState } from "react";
import { BsBank } from "react-icons/bs";

export function BankSettings() {
  const [saving, setSaving] = useState(false);
  const [bankDetail, setBankDetail] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Mock save delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("Bank details updated successfully (Mock)");
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="bg-alert-bg border border-alert-border rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm">
        <div className="bg-[#10367D] p-3 rounded-full text-white shrink-0">
          <BsBank size={24} />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Payout Destination</h4>
          <p className="text-sm text-foreground/80 mt-1">
            This bank account will receive all funds from your split bills and escrow payments once they are released.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select Bank</label>
          <select
            value={bankDetail.bankName}
            onChange={(e) => setBankDetail({ ...bankDetail, bankName: e.target.value })}
            className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Select a bank</option>
            <option value="access">Access Bank</option>
            <option value="gtb">GTBank</option>
            <option value="zenith">Zenith Bank</option>
            <option value="kuda">Kuda Bank</option>
            <option value="moniepoint">Moniepoint</option>
            <option value="opay">OPay</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Account Number</label>
          <input
            type="text"
            value={bankDetail.accountNumber}
            onChange={(e) => setBankDetail({ ...bankDetail, accountNumber: e.target.value })}
            className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="0123456789"
            maxLength={10}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Account Name</label>
          <input
            type="text"
            value={bankDetail.accountName}
            onChange={(e) => setBankDetail({ ...bankDetail, accountName: e.target.value })}
            className="w-full bg-sidebar-bg border border-border rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            placeholder="Account holder's name"
          />
          <p className="text-[11px] text-muted-foreground">The name must match your legal identity for successful payouts.</p>
        </div>

        <div className="pt-4 border-t border-border mt-8">
          <button
            type="submit"
            disabled={saving || !bankDetail.bankName || !bankDetail.accountNumber}
            className="bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-900 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? "Saving Details..." : "Save Bank Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
