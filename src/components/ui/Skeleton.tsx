"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

export function Skeleton({ className = "", variant = "rectangular" }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-zinc-800";
  const variantClasses = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-3xl",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

export function TransactionSkeleton() {
  return (
    <div className="bg-[#f2f4f7] rounded-3xl p-6 flex flex-col justify-between h-64 border border-transparent animate-in fade-in duration-500">
      <div className="flex justify-between items-start mb-6">
        <Skeleton variant="rectangular" className="w-16 h-5 rounded" />
        <Skeleton variant="rectangular" className="w-20 h-5 rounded" />
      </div>

      <div className="mb-6">
        <Skeleton variant="text" className="w-3/4 h-6 mb-2" />
        <Skeleton variant="text" className="w-1/2 h-10 mb-2" />
        <Skeleton variant="text" className="w-1/3 h-4" />
      </div>

      <div className="mt-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex -space-x-1.5 focus-within:z-10">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="circular" className="w-7 h-7 border-2 border-[#f2f4f7]" />
            ))}
          </div>
          <Skeleton variant="text" className="w-24 h-4" />
        </div>
        <Skeleton variant="rectangular" className="w-full h-1 rounded-full" />
      </div>
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <Skeleton variant="text" className="h-8 w-48 mb-2" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-20">
        <div className="flex-1 space-y-6">
          <Skeleton variant="rectangular" className="h-64 w-full" />
          <div className="space-y-4">
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-12 w-full" />
            <Skeleton variant="text" className="h-12 w-full" />
            <Skeleton variant="text" className="h-12 w-full" />
          </div>
        </div>
        <div className="w-full lg:w-[340px]">
          <Skeleton variant="rectangular" className="h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
export function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" className="w-10 h-10" />
            <div>
              <Skeleton variant="text" className="h-4 w-48 mb-2" />
              <Skeleton variant="text" className="h-3 w-32" />
            </div>
          </div>
          <Skeleton variant="text" className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
