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
    <div className="bg-[#E2E9ED] flex-col lg:flex-row border border-[#10367D] rounded-xl p-4 flex items-center justify-between mb-8 shadow-sm">
      <div className="flex flex-row items-center gap-4">
        <div className="bg-[#FFC107] p-2 rounded-full">
          <BsExclamationTriangle fill="#ffffff" size={16} />
        </div>
        <div className="flex flex-col lg:flex-row">
          <h3 className="font-medium text-lg text-[#000000]">Complete payout setup</h3>
          <p className="text-base font-normal text-[#000000] mt-0.5">
            Add a bank account to receive released funds from your splits and escrows.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/settings?tab=bank"
        className="flex items-start lg:items-center gap-2 border border-[#10367D] text-[#10367D] p-3  rounded-full text-base font-normal whitespace-nowrap"
      >
        Setup bank
        <LuArrowUpRight size={16} />
      </Link>
    </div>
  );
}
