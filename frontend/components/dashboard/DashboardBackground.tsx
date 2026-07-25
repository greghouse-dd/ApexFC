"use client";

import { useEffect, useState } from "react";

const IMAGES = [
  "/images/dashboard/dash-1.jpg",
  "/images/dashboard/dash-2.jpg",
  "/images/dashboard/dash-3.jpg",
  "/images/dashboard/dash-4.jpg",
];

export default function DashboardBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Transition photos every 8 seconds
    const interval = setInterval(() => {
      const nextIdx = (currentIndex + 1) % IMAGES.length;
      setIsTransitioning(true);
      setNextIndex(nextIdx);

      setTimeout(() => {
        setCurrentIndex(nextIdx);
        setIsTransitioning(false);
      }, 1500); // Crossfade duration matching transition-opacity
    }, 8000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      {/* Background Images Stack */}
      {IMAGES.map((src, index) => {
        const isActive = index === currentIndex;
        const isNext = index === nextIndex && isTransitioning;
        const isVisible = isActive || isNext;

        return (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center filter brightness-[0.9] contrast-[1.05] blur-[1.5px] scale-105 transition-opacity duration-[1500ms] ease-in-out ${
              isVisible ? "opacity-55" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${src})` }}
          />
        );
      })}

      {/* Subtle overlays to protect legibility of dashboard data panels */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/45 to-background" />
    </div>
  );
}
