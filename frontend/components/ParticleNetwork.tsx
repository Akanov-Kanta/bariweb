"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  canvasWidth: number;
  canvasHeight: number;
  isPulsating: boolean;
  pulsatePhase: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.size = Math.random() * 3 + 1.5;
    this.opacity = Math.random() * 0.5 + 0.1;
    this.isPulsating = Math.random() > 0.9;
    this.pulsatePhase = Math.random() * Math.PI * 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0 || this.x > this.canvasWidth) this.vx *= -1;
    if (this.y < 0 || this.y > this.canvasHeight) this.vy *= -1;

    if (this.isPulsating) {
      this.pulsatePhase += 0.05;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    
    let currentSize = this.size;
    const currentOpacity = this.opacity;
    let color = `rgba(255, 255, 255, ${currentOpacity})`;

    if (this.isPulsating) {
      const scale = 1 + Math.sin(this.pulsatePhase) * 0.8; // scales 1 -> 1.8 -> 1
      currentSize *= Math.max(1, scale);
      color = `rgba(59, 130, 246, ${Math.min(0.9, currentOpacity * 1.5)})`; // Blue glow
    }

    ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    if (this.isPulsating) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(59, 130, 246, 0.8)";
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    }
  }
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    const maxDistance = 160;
    const particleCount = 120;

    let mouseX = 0;
    let mouseY = 0;
    
    // Setup canvas
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        particles = Array.from({ length: particleCount }, () => new Particle(canvas.width, canvas.height));
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let activeLinkFrame = 0;
    let randomActiveSource = -1;
    let randomActiveTarget = -1;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      activeLinkFrame++;
      if (activeLinkFrame > 180) { // roughly every 3 seconds
        activeLinkFrame = 0;
        randomActiveSource = Math.floor(Math.random() * particleCount);
      }

      // Parallax offset
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const offsetX = (mouseX - centerX) * 0.05;
      const offsetY = (mouseY - centerY) * 0.05;

      ctx.save();
      ctx.translate(offsetX, offsetY);

      // Update and draw connections
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            
            // Highlight a random link sometimes
            let isHighlight = false;
            if (i === randomActiveSource && activeLinkFrame < 60) {
              if (randomActiveTarget === -1) randomActiveTarget = j;
              isHighlight = true;
            }

            if (isHighlight) {
               ctx.strokeStyle = `rgba(59, 130, 246, ${1 - activeLinkFrame / 60})`;
               ctx.lineWidth = 2;
            } else {
               const opacityValue = (1 - distance / maxDistance) * 0.15;
               ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue})`;
               ctx.lineWidth = 1;
            }

            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        
        particles[i].draw(ctx);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent rounded-full blur-[100px]" />
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full z-0 opacity-40 md:opacity-50 pointer-events-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
