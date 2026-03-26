import { WelcomeSection } from "@/src/features/dashboard/components/WelcomeSection";
import { PayoutSetupAlert } from "@/src/features/dashboard/components/PayoutSetupAlert";
import { ActiveTransactions } from "@/src/features/dashboard/components/ActiveTransactions";
import { RecentActivity } from "@/src/features/dashboard/components/RecentActivity";

export default function DashboardPage() {
  return (
    <>
      <WelcomeSection />
      <PayoutSetupAlert />
      <div className="bg-sidebar-bg p-4 rounded-2xl flex flex-col gap-8">
        <ActiveTransactions />
        <RecentActivity />
      </div>
    </>
  );
}
