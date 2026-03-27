"use client";

import { useEffect, useState } from "react";
import { LuArrowUpRight } from "react-icons/lu";
import { BsExclamationTriangle } from "react-icons/bs";
import Link from "next/link";
import { supabase } from "@/src/utils/supabase/client";

export function PayoutSetupAlert() {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkBankVerified() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setShow(false); setChecked(true); return; }

      const { data } = await supabase
        .from("profiles")
        .select("bank_verified")
        .eq("id", user.id)
        .single();

      setShow(!data?.bank_verified);
      setChecked(true);
    }
    checkBankVerified();
  }, []);

  if (!checked || !show) return null;

  return (
    <div className="bg-[#E2E9ED] border border-[#10367D] rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 shadow-sm">
      <div className="flex flex-row items-start gap-4">
        <div className="bg-[#FFC107] p-2.5 rounded-full shrink-0 mt-1">
          <BsExclamationTriangle fill="#ffffff" size={20} />
        </div>
        <div>
          <h3 className="font-medium text-lg text-[#000000]">Complete payout setup</h3>
          <p className="text-base font-normal text-gray-600 mt-1 leading-relaxed max-w-md">
            Add a bank account to receive released funds from your splits and escrows. This is required for withdrawals.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/settings?tab=bank"
        className="w-full md:w-auto flex items-center justify-center gap-2 border border-[#10367D] text-[#10367D] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#10367D]/5 transition-all active:scale-[0.98] whitespace-nowrap"
      >
        Setup bank
        <LuArrowUpRight size={18} />
      </Link>
    </div>
  );
}
