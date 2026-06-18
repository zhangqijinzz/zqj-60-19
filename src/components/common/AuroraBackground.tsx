import { useEffect, useRef } from 'react';

interface AuroraBackgroundProps {
  theme?: 'aurora' | 'ocean' | 'forest' | 'sunset';
  intensity?: number;
}

const THEME_COLORS: Record<string, [string, string, string]> = {
  aurora: ['#7c3aed', '#22d3ee', '#a78bfa'],
  ocean: ['#0ea5e9', '#06b6d4', '#38bdf8'],
  forest: ['#22c55e', '#84cc16', '#10b981'],
  sunset: ['#f97316', '#ec4899', '#f43f5e'],
};

export function AuroraBackground({ theme = 'aurora', intensity = 1 }: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = THEME_COLORS[theme];
    const particles: { x: number; y: number; vx: number; vy: number; size: number; colorIdx: number }[] = [];

    for (let i = 0; i < 80 * intensity; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 0.5,
        colorIdx: Math.floor(Math.random() * 3),
      });
    }

    const blobs = [
      { x: canvas.width * 0.2, y: canvas.height * 0.3, r: 0, colorIdx: 0 },
      { x: canvas.width * 0.8, y: canvas.height * 0.7, r: 0, colorIdx: 1 },
      { x: canvas.width * 0.5, y: canvas.height * 0.5, r: 0, colorIdx: 2 },
    ];

    const render = () => {
      timeRef.current += 0.005;
      const t = timeRef.current;

      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      blobs.forEach((blob, i) => {
        blob.x = canvas.width * (0.3 + 0.2 * Math.sin(t * 0.7 + i));
        blob.y = canvas.height * (0.3 + 0.2 * Math.cos(t * 0.5 + i * 1.3));
        blob.r = canvas.width * (0.35 + 0.05 * Math.sin(t + i));

        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        gradient.addColorStop(0, colors[blob.colorIdx] + '55');
        gradient.addColorStop(0.5, colors[blob.colorIdx] + '18');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkle = 0.5 + 0.5 * Math.sin(t * 3 + p.x * 0.01);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * twinkle, 0, Math.PI * 2);
        ctx.fillStyle = colors[p.colorIdx] + Math.floor(twinkle * 180 + 75).toString(16).padStart(2, '0');
        ctx.fill();
      });

      if (Math.random() < 0.002) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height * 0.5;
        const len = 100 + Math.random() * 200;
        const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + Math.cos(angle) * len, startY + Math.sin(angle) * len);
        const gradient = ctx.createLinearGradient(startX, startY, startX + Math.cos(angle) * len, startY + Math.sin(angle) * len);
        gradient.addColorStop(0, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(1, 'transparent');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [theme, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
