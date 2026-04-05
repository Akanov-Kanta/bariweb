"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);


  const moveCursor = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);

    // Efficiently check for interactive elements without triggering reflows
    const target = e.target as HTMLElement;
    if (!target) return;

    // Use a simpler tag-based check which is much faster than getComputedStyle
    const isInteractive = 
      target.closest("button") || 
      target.closest("a") || 
      target.closest("input") || 
      target.closest("textarea") ||
      target.closest("select") ||
      target.style.cursor === 'pointer' ||
      target.classList.contains('cursor-pointer');
    
    setIsHovered(!!isInteractive);
  }, [cursorX, cursorY]);

  useEffect(() => {
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", moveCursor, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    setIsVisible(true);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [moveCursor]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden">
      {/* Small dot - Real-time position */}
      <motion.div
        className="absolute left-0 top-0 h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]"
        animate={{
          scale: isHovered ? 0 : 1,
          opacity: isHovered ? 0 : 1,
        }}
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      {/* Trailing circle - Spring animation */}
      <motion.div
        className="absolute left-0 top-0 rounded-full border border-lime-400/50 bg-lime-400/10"
        animate={{
          width: isHovered ? 60 : 32,
          height: isHovered ? 60 : 32,
          backgroundColor: isHovered ? "rgba(163, 230, 53, 0.2)" : "rgba(163, 230, 53, 0.1)",
          borderColor: isHovered ? "rgba(163, 230, 53, 0.8)" : "rgba(163, 230, 53, 0.5)",
        }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 300,
        }}
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </div>
  );
}
