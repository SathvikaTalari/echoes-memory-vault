import React, { useEffect, useRef } from 'react';

interface PetalShowerProps {
  density?: number; // count of particles
  enabled?: boolean;
}

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
}

export const PetalShower: React.FC<PetalShowerProps> = ({ density = 25, enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
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

    const petalColors = [
      '#FF9E1B', // Bright golden orange
      '#EA580C', // Deep marigold orange
      '#F59E0B', // Amber gold
      '#FBBF24', // Warm candlelight yellow
      '#C2410C'  // Altar burnt orange
    ];

    const petals: Petal[] = [];
    for (let i = 0; i < density; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: Math.random() * 8 + 6,
        speedY: Math.random() * 0.8 + 0.5,
        speedX: Math.random() * 0.6 - 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.5 + 0.3,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.01
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach(p => {
        p.y += p.speedY;
        p.wobble += p.wobbleSpeed;
        p.x += Math.sin(p.wobble) * 0.8 + p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        // Draw organic petal curve
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(p.size / 2, -p.size / 2, p.size, -p.size / 4, p.size, 0);
        ctx.bezierCurveTo(p.size, p.size / 4, p.size / 2, p.size / 2, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fill();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{ opacity: 0.85 }}
    />
  );
};
