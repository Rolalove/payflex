import React from "react";

const mockActivities = [
  {
    icon: "C",
    iconColor: "bg-blue-100 text-blue-400",
    title: "Chidi paid for Dinner at SoulFood",
    subtitle: "Split Bill • Paid • 30 mins ago",
    amount: "+ ₦ 90,000",
    amountColor: "text-green-500"
  },
  {
    icon: "A",
    iconColor: "bg-green-100 text-green-500",
    title: "Amaka Joined Lola's Wedding Bridesmaid",
    subtitle: "Split Bill • Invited • 3 hrs ago",
    amount: "",
    amountColor: ""
  }
];

export function RecentActivity() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-foreground">Recent Activity</h2>
        <button className="text-[#10367D] text-sm font-medium hover:underline">View all</button>
      </div>

      <div className="bg-[#f9f9f9] rounded-3xl p-2">
        {mockActivities.map((act, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white transition-colors cursor-default">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium border border-gray-100 ${act.iconColor}`}>
                {act.icon}
              </div>
              <div>
                <p className="text-[14px] font-medium text-gray-900 mb-0.5">{act.title}</p>
                <p className="text-[12px] text-gray-500">{act.subtitle}</p>
              </div>
            </div>
            {act.amount && (
              <div className={`text-[17px] font-medium tracking-tight ${act.amountColor}`}>
                {act.amount}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
