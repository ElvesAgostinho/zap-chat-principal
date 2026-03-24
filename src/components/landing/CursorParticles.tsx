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
      velocity: number;

      constructor(x: number, y: number, velocity: number) {
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.size = Math.random() * 0.8 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.color = '#24FF6B';
        this.opacity = Math.min(0.7 + (velocity * 0.05), 1.0);
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.opacity > 0.005) this.opacity -= 0.005;
        this.size *= 0.98;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(36, 255, 107, ${this.opacity})`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#24FF6B';
        ctx.fill();
        
        // Link particles that are close
        ctx.strokeStyle = `rgba(36, 255, 107, ${this.opacity * 0.2})`;
        ctx.lineWidth = 0.5;
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const dx = mouse.current.x - lastMouse.current.x;
      const dy = mouse.current.y - lastMouse.current.y;
      const velocity = Math.sqrt(dx * dx + dy * dy);

      // Interpolate mouse position for smoothness (easing)
      lastMouse.current.x += dx * 0.1;
      lastMouse.current.y += dy * 0.1;

      // Add particles based on velocity
      if (velocity > 0.5) {
        const amount = Math.min(Math.floor(velocity / 1.5), 8);
        for (let i = 0; i < amount; i++) {
          particles.current.push(new Particle(
            lastMouse.current.x + (Math.random() - 0.5) * 10, 
            lastMouse.current.y + (Math.random() - 0.5) * 10,
            velocity
          ));
        }
      }

      for (let i = 0; i < particles.current.length; i++) {
        particles.current[i].update();
        particles.current[i].draw();

        if (particles.current[i].opacity <= 0.01 || particles.current[i].size <= 0.2) {
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
      className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-transparent"
    />
  );
};

