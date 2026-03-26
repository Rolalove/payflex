import { LuArrowUpRight } from "react-icons/lu";
import { BsExclamationTriangle } from "react-icons/bs";
import Link from "next/link";

export function PayoutSetupAlert() {
  return (
    <div className="bg-alert-bg border border-alert-border rounded-xl p-4 flex items-center justify-between mb-8 shadow-sm">
      <div className="flex flex-row items-start gap-4">
        <div className="bg-[#f5a623] p-2 rounded-full">
          <BsExclamationTriangle fill="#ffffff" size={16}/>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Complete payout setup</h3>
          <p className="text-sm text-foreground/80 mt-0.5">
            Add a bank account to receive released funds from your splits and escrows.
          </p>
        </div>
      </div>
      <Link 
        href="/dashboard/settings?tab=bank" 
        className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-full text-base font-medium hover:bg-primary/5 transition-colors whitespace-nowrap"
      >
        Setup bank
        <LuArrowUpRight size={16}/>
      </Link>
    </div>
  );
}
