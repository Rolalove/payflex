export function EmptyActivityView() {
  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-border flex flex-col items-center justify-center p-12 mt-4 min-h-[400px]">
      <div className="w-32 h-32 mb-6 text-gray-300 relative">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="25" y="15" width="50" height="70" rx="4" stroke="currentColor" strokeWidth="4" fill="none"/>
          <line x1="35" y1="35" x2="65" y2="35" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
          <line x1="35" y1="50" x2="65" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
          <line x1="35" y1="65" x2="50" y2="65" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
          <path d="M45 25C45 23.3431 46.3431 22 48 22H52C53.6569 22 55 23.3431 55 25V30H45V25Z" fill="currentColor"/>
          <circle cx="70" cy="80" r="12" fill="white" stroke="currentColor" strokeWidth="4"/>
          <circle cx="70" cy="80" r="3" fill="currentColor"/>
        </svg>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">No activity yet</h3>
      <p className="text-muted-foreground">Please add split bill or escrow</p>
    </div>
  );
}
