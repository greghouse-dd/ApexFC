"use client";

import { useEffect, useRef, useState } from "react";

const VIDEOS = [
  "/videos/home/home-1.mp4",
  "/videos/home/home-2.mp4",
  "/videos/home/home-3.mp4",
  "/videos/home/home-4.mp4",
];

export default function HomepageBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    // Start playing the first video on mount
    const activeVideo = videoRefs.current[0];
    if (activeVideo) {
      activeVideo.play().catch((err) => console.log("Autoplay blocked:", err));
    }
  }, []);

  const handleVideoEnded = (index: number) => {
    if (index !== currentIndex || isTransitioning) return;

    const nextIdx = (index + 1) % VIDEOS.length;
    const nextVideo = videoRefs.current[nextIdx];

    if (nextVideo) {
      nextVideo.currentTime = 0;
      nextVideo.play()
        .then(() => {
          setIsTransitioning(true);
          setNextIndex(nextIdx);

          setTimeout(() => {
            const oldVideo = videoRefs.current[currentIndex];
            if (oldVideo) {
              oldVideo.pause();
            }
            setCurrentIndex(nextIdx);
            setIsTransitioning(false);
          }, 1500);
        })
        .catch((err) => {
          console.error("Failed to transition homepage video:", err);
          setCurrentIndex(nextIdx);
        });
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background">
      {/* Background Videos Stack */}
      {VIDEOS.map((src, index) => {
        const isActive = index === currentIndex;
        const isNext = index === nextIndex && isTransitioning;
        const isVisible = isActive || isNext;

        return (
          <video
            key={src}
            ref={(el) => {
              videoRefs.current[index] = el;
            }}
            src={src}
            muted
            playsInline
            onEnded={() => handleVideoEnded(index)}
            className={`absolute inset-0 h-full w-full object-cover filter brightness-[1.2] contrast-[1.1] blur-[1.5px] scale-105 transition-opacity duration-[1500ms] ease-in-out ${
              isVisible ? "opacity-80" : "opacity-0"
            }`}
          />
        );
      })}

      {/* Subtle overlays to protect legibility of hero text and features */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/40" />
    </div>
  );
}
