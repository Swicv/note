import React, { useEffect, useRef } from 'react';

interface CosmoBackgroundProps {
  isDark?: boolean;
}

export const CosmoBackground: React.FC<CosmoBackgroundProps> = ({ isDark = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isDark) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate stars
    const starCount = Math.floor((width * height) / 8000);
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.005 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Render subtle stardust
      for (const star of stars) {
        const currentAlpha = star.alpha * (0.6 + 0.4 * Math.sin(time * star.speed + star.phase));
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark]);

  if (!isDark) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/50">
        {/* Subtle Solar Day Atmosphere */}
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-200/20 via-purple-200/15 to-transparent blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tl from-cyan-200/20 via-sky-200/15 to-transparent blur-[140px]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background canvas for star twinkling */}
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />

      {/* Atmospheric Nebula Gradients */}
      <div className="absolute -top-[25%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-purple-900/15 via-indigo-900/10 to-transparent blur-[120px]" />
      <div className="absolute top-[40%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-cyan-900/15 via-blue-900/10 to-transparent blur-[140px]" />
      <div className="absolute -bottom-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-pink-900/10 to-transparent blur-[100px]" />
    </div>
  );
};
