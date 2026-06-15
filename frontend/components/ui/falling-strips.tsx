"use client";

import { useEffect, useRef } from "react";

interface Strip {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
}

const COLORS = [
  "rgba(99,102,241,",   // indigo (primary)
  "rgba(139,92,246,",   // violet
  "rgba(59,130,246,",   // blue
  "rgba(16,185,129,",   // emerald
  "rgba(148,163,184,",  // slate
];

function createStrip(canvasWidth: number): Strip {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    x: Math.random() * canvasWidth,
    y: -Math.random() * 600,
    width: 2 + Math.random() * 4,
    height: 40 + Math.random() * 100,
    speed: 0.6 + Math.random() * 1.6,
    opacity: 0.08 + Math.random() * 0.18,
    rotation: (Math.random() - 0.5) * 0.4,
    rotationSpeed: (Math.random() - 0.5) * 0.003,
    color,
  };
}

export function FallingStrips() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const STRIP_COUNT = 60;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const strips: Strip[] = Array.from({ length: STRIP_COUNT }, () =>
      createStrip(canvas.width)
    );

    // Scatter vertically on init so they don't all start at the top
    strips.forEach((s) => {
      s.y = Math.random() * canvas.height;
    });

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of strips) {
        ctx.save();
        ctx.translate(s.x, s.y + s.height / 2);
        ctx.rotate(s.rotation);

        ctx.fillStyle = `${s.color}${s.opacity})`;
        ctx.beginPath();
        ctx.roundRect(-s.width / 2, -s.height / 2, s.width, s.height, s.width / 2);
        ctx.fill();

        ctx.restore();

        s.y += s.speed;
        s.rotation += s.rotationSpeed;

        if (s.y > canvas.height + s.height) {
          Object.assign(s, createStrip(canvas.width));
          s.y = -s.height;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
