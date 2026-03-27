"use client";

import { WelcomeSection } from "@/src/features/dashboard/components/WelcomeSection";
import { PayoutSetupAlert } from "@/src/features/dashboard/components/PayoutSetupAlert";
import { ActiveTransactions } from "@/src/features/dashboard/components/ActiveTransactions";
import { RecentActivity } from "@/src/features/dashboard/components/RecentActivity";
import { useDashboardSummary } from "@/src/features/dashboard/hooks/useDashboardSummary";

export default function DashboardPage() {
  const { isDashboardEmpty, isActivityEmpty, isLoading } = useDashboardSummary();

  return (
    <>
      <WelcomeSection />
      <PayoutSetupAlert />
      
      <div className="bg-sidebar-bg p-4 rounded-2xl flex flex-col gap-8">
        {/* If completely empty, just show Transactions (as an illustration) without header */}
        {isDashboardEmpty && !isLoading ? (
          <ActiveTransactions hideHeader />
        ) : (
          <>
            <ActiveTransactions />
            {/* If there are transactions but no activity, show a simple activity placeholder */}
            <RecentActivity variant={isActivityEmpty ? 'simple' : 'full'} />
          </>
        )}
      </div>
    </>
  );
}
