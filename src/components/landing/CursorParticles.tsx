import React, { useEffect, useRef } from 'react';

export const CursorParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 1;
        this.speedY = (Math.random() - 0.5) * 1;
        this.color = '#24FF6B';
        this.opacity = 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.opacity > 0.01) this.opacity -= 0.015;
        this.size *= 0.98;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(36, 255, 107, ${this.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#24FF6B';
        ctx.fill();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Interpolate mouse position for smoothness (easing)
      lastMouse.current.x += (mouse.current.x - lastMouse.current.x) * 0.1;
      lastMouse.current.y += (mouse.current.y - lastMouse.current.y) * 0.1;

      // Add particles at mouse position
      if (Math.abs(mouse.current.x - lastMouse.current.x) > 0.1 || Math.abs(mouse.current.y - lastMouse.current.y) > 0.1) {
        for (let i = 0; i < 2; i++) {
          particles.current.push(new Particle(lastMouse.current.x, lastMouse.current.y));
        }
      }

      for (let i = 0; i < particles.current.length; i++) {
        particles.current[i].update();
        particles.current[i].draw();

        if (particles.current[i].opacity <= 0.01 || particles.current[i].size <= 0.5) {
          particles.current.splice(i, 1);
          i--;
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] opacity-70"
    />
  );
};
