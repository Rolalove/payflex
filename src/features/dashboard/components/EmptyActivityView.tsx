import Image from "next/image";

export function EmptyActivityView() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in duration-700">
      {/* Centralized Asset */}
      <div className="relative w-28 h-28 mb-6">
        <Image 
          src="/No-activity.svg" 
          alt="No activity yet" 
          fill
          className="object-contain"
          priority
        />
      </div>

      <h3 className="text-xl font-medium text-[#252526] mb-2">No activity yet</h3>
      <p className="text-[#B7B6B6] font-normal max-w-xs leading-relaxed">Please add split bill or escrow</p>
    </div>
  );
}
