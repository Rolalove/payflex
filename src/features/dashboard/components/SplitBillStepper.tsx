"use client";

import React from "react";
import { LuCheck, LuUser, LuLock } from "react-icons/lu";

interface SplitBillStepperProps {
  status: 'Collecting' | 'Action Needed' | 'Released' | 'Disputed' | string;
}

export function SplitBillStepper({ status }: SplitBillStepperProps) {
  const isDisputed = status === 'Disputed';

  const steps = [
    {
      id: 1,
      label: "Create Split",
      icon: LuCheck,
      isDone: true,
      isActive: false,
    },
    {
      id: 2,
      label: isDisputed ? "Disputed" : "Collecting",
      icon: isDisputed ? LuLock : LuUser,
      isDone: !isDisputed && (status === 'Action Needed' || status === 'Released'),
      isActive: status === 'Collecting' || isDisputed,
      isError: isDisputed,
    },
    {
      id: 3,
      label: "All paid",
      icon: LuCheck,
      isDone: status === 'Released',
      isActive: status === 'Action Needed',
    },
    {
      id: 4,
      label: "Release funds",
      icon: LuLock,
      isDone: false,
      isActive: status === 'Released',
    },
  ];

  return (
    <div className={`w-full ${isDisputed ? 'bg-red-50' : 'bg-[#EBEBEB]'} rounded-full px-8 py-6 flex items-center justify-between relative overflow-hidden transition-colors duration-500`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const Icon = step.icon;
        
        let circleClass = "";
        let iconClass = "";
        let labelClass = "text-[11px] font-bold mt-2 uppercase tracking-tight";
        let lineClass = "flex-1 h-[2px] mx-2 -mt-6 transition-all duration-700 ";

        if (step.isError) {
          circleClass = "bg-red-600 text-white shadow-lg shadow-red-100";
          iconClass = "text-white";
          lineClass += "bg-red-200";
        } else if (step.isDone) {
          circleClass = "bg-[#34A853] text-white shadow-lg shadow-green-100";
          iconClass = "text-white";
          lineClass += "bg-[#34A853]";
        } else if (step.isActive) {
          circleClass = "bg-white border-2 border-[#10367D] text-[#10367D] shadow-xl shadow-blue-50";
          iconClass = "text-[#10367D]";
          lineClass += "bg-gray-200";
        } else {
          circleClass = "bg-white border-2 border-gray-200 text-gray-300";
          iconClass = "text-gray-300";
          lineClass += "bg-gray-200";
        }

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${circleClass} ${step.isActive && !step.isError ? 'ring-4 ring-blue-50' : ''}`}>
                <Icon size={20} className={`${iconClass} ${step.isActive && step.id === 2 && !isDisputed ? 'animate-pulse' : ''}`} />
              </div>
              <span className={`hidden sm:block ${labelClass} ${step.isError ? 'text-red-600' : (step.isDone || step.isActive) ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            
            {!isLast && (
              <div className={lineClass}>
                <div 
                  className={`h-full transition-all duration-1000 ease-in-out ${
                    step.isError ? 'bg-red-400 w-full' : step.isDone ? 'bg-[#34A853] w-full' : 'w-0'
                  }`} 
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
