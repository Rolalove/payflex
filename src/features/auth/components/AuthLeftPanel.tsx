"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  {
    title: "Split payments without confusion",
    description: "Create shared payments, invite people, and track who has paid in real time.",
    image: "/signup-flow-one.svg"
  },
  {
    title: "Pay together, settle instantly",
    description: "For dinners, outings, rent, or shared bills, each person pays their part to pool funds for outings, trips or pay back a selected recipient.",
    image: "/signup-flow-two.svg"
  },
  {
    title: "Hold funds safely until both parties agrees",
    description: "Hold funds safely until both parties agrees",
    image: "/signup-flow-three.svg"
  }
];

export function AuthLeftPanel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex flex-col justify-between w-[45%] max-w-[560px] bg-linear-to-b from-[#0f2d72] to-[#2563eb] rounded-3xl p-10 text-white relative overflow-hidden transition-all duration-500 gap-y-10">
      <div>
       <Image src="/FlexPayLogo-white.svg" alt="FlexPay Logo" width={122} height={32} />
      </div>

      {/* Sign Up Image */}
      <div className="relative w-full min-h-[250px] flex items-center justify-center">
        <Image 
          src={slides[currentSlide].image} 
          alt={slides[currentSlide].title} 
          layout="fill" 
          objectFit="contain"
          quality={100}
          className="transition-opacity duration-500"
        />
      </div>

      <div className="flex flex-col justify-end">
        <h2 className="text-2xl font-medium mb-3 transition-opacity duration-300">
          {slides[currentSlide].title}
        </h2>
        <p className="text-blue-100 font-medium text-base leading-relaxed transition-opacity duration-300">
          {slides[currentSlide].description}
        </p>
      </div>

      {/* Indicators */}
      <div className="flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all duration-500 ${
              currentSlide === idx ? "w-12 bg-white" : "w-2 bg-white/30 cursor-pointer"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
