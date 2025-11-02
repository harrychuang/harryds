import React, { useCallback, useEffect, useRef, useState } from 'react';
import './ClickFireworks.scss';

type Particle = {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  size: number;
  duration: number;
  delay: number;
  bgX: number;
  bgY: number;
};

const ClickFireworks: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const particleTimeoutsRef = useRef<number[]>([]);

  const spawnParticles = useCallback((clientX: number, clientY: number) => {
    const count = Math.floor(Math.random() * 30) + 30; // 30-60 顆粒子
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;
      const size = 4 + Math.random() * 6;
      const duration = 450 + Math.random() * 400;
      const delay = Math.random() * 120;
      const bgX = Math.random() * 100;
      const bgY = Math.random() * 100;
      const id = particleIdRef.current++;

      newParticles.push({
        id,
        x: clientX,
        y: clientY,
        targetX,
        targetY,
        size,
        duration,
        delay,
        bgX,
        bgY,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);

    newParticles.forEach((particle) => {
      const timeoutId = window.setTimeout(() => {
        setParticles((prev) => prev.filter((item) => item.id !== particle.id));
        particleTimeoutsRef.current = particleTimeoutsRef.current.filter(
          (value) => value !== timeoutId
        );
      }, particle.duration + particle.delay);

      particleTimeoutsRef.current.push(timeoutId);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      spawnParticles(e.clientX, e.clientY);
    };

    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        spawnParticles(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('touchstart', handleTouch);

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouch);
      particleTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      particleTimeoutsRef.current = [];
    };
  }, [spawnParticles]);

  return (
    <div className="click-fireworks">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="click-fireworks__particle"
          style={
            {
              '--particle-x': `${particle.x}px`,
              '--particle-y': `${particle.y}px`,
              '--particle-target-x': `${particle.targetX}px`,
              '--particle-target-y': `${particle.targetY}px`,
              '--particle-size': `${particle.size}px`,
              '--particle-delay': `${particle.delay}ms`,
              '--particle-duration': `${particle.duration}ms`,
              '--particle-bg-x': `${particle.bgX}%`,
              '--particle-bg-y': `${particle.bgY}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
};

export default ClickFireworks;

