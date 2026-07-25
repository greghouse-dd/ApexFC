"use client";

import { useEffect, useRef, useState } from "react";

const VIDEOS = [
  "/videos/football-1.mp4",
  "/videos/football-2.mp4",
  "/videos/football-3.mp4",
  "/videos/football-4.mp4",
  "/videos/football-5.mp4",
  "/videos/football-6.mp4",
  "/videos/football-7.mp4",
];

export default function BackgroundGrid() {
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
    // Only transition if it's the currently active video ending (and we aren't already transitioning)
    if (index !== currentIndex || isTransitioning) return;

    const nextIdx = (index + 1) % VIDEOS.length;
    const nextVideo = videoRefs.current[nextIdx];

    if (nextVideo) {
      // Pre-warm and start playing the next video
      nextVideo.currentTime = 0;
      nextVideo.play()
        .then(() => {
          // Trigger the crossfade transition
          setIsTransitioning(true);
          setNextIndex(nextIdx);

          // Wait for transition duration (1.5s) to finalize state and pause old video
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
          console.error("Failed to transition on video end:", err);
          // Fallback: swap immediately if play is blocked
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
              isVisible ? "opacity-95" : "opacity-0"
            }`}
          />
        );
      })}

      {/* Light overlay to protect text readability while keeping the video bright and vivid */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,rgba(15,23,42,0.3)_100%)]" />

      {/* Futuristic Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(#1c2230_1px,transparent_1px),linear-gradient(90deg,#1c2230_1px,transparent_1px)] bg-size-[40px_40px] opacity-15" />
    </div>
  );
}