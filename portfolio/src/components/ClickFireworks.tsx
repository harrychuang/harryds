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
  const isMouseDownRef = useRef(false);
  const intervalIdRef = useRef<number | null>(null);
  const currentPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const spawnParticles = useCallback((clientX: number, clientY: number) => {
    const count = Math.floor(Math.random() * 10) + 20; // 30-60 顆粒子
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 80;
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

  // 開始連續觸發煙火
  const startContinuousFireworks = useCallback((clientX: number, clientY: number) => {
    // 清除舊的 interval
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
    }

    // 立即觸發一次
    spawnParticles(clientX, clientY);
    currentPositionRef.current = { x: clientX, y: clientY };

    // 每 200ms 觸發一次
    intervalIdRef.current = window.setInterval(() => {
      spawnParticles(currentPositionRef.current.x, currentPositionRef.current.y);
    }, 200);
  }, [spawnParticles]);

  // 停止連續觸發
  const stopContinuousFireworks = useCallback(() => {
    isMouseDownRef.current = false;
    if (intervalIdRef.current) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 只響應左鍵點擊（button === 0）
      if (e.button !== 0) return;
      // 只在單純點擊時觸發（非長按）
      if (!isMouseDownRef.current) {
        spawnParticles(e.clientX, e.clientY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // 只響應左鍵按下（button === 0）
      if (e.button !== 0) return;
      isMouseDownRef.current = true;
      startContinuousFireworks(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDownRef.current) {
        currentPositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      stopContinuousFireworks();
    };

    // 手機端：只觸發一次，不連續觸發
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        spawnParticles(touch.clientX, touch.clientY);
      }
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      
      // 清理
      stopContinuousFireworks();
      particleTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      particleTimeoutsRef.current = [];
    };
  }, [spawnParticles, startContinuousFireworks, stopContinuousFireworks]);

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

