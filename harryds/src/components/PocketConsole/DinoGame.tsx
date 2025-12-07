// =============================================================================
// DINO GAME - 恐龍跳躍風格小遊戲
// - 使用 HarryAnimation rotation frames 作為角色
// - 跳躍時 frame 會 loop 一次
// - 躲避障礙物，計算分數
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PocketConsoleButton } from './PocketConsole';

// 引入 rotation 圖片
import rotation0 from '../../../assets/imgs/me/rotation-0.png';
import rotation1 from '../../../assets/imgs/me/rotation-1.png';
import rotation2 from '../../../assets/imgs/me/rotation-2.png';
import rotation3 from '../../../assets/imgs/me/rotation-3.png';
import rotation4 from '../../../assets/imgs/me/rotation-4.png';
import rotation5 from '../../../assets/imgs/me/rotation-5.png';
import rotation6 from '../../../assets/imgs/me/rotation-6.png';
import rotation7 from '../../../assets/imgs/me/rotation-7.png';
import rotation8 from '../../../assets/imgs/me/rotation-8.png';
import rotation9 from '../../../assets/imgs/me/rotation-9.png';

const rotationFrames = [
  rotation0, rotation1, rotation2, rotation3, rotation4,
  rotation5, rotation6, rotation7, rotation8, rotation9,
];

// 遊戲常數
const GAME_WIDTH = 96;   // 螢幕寬度 (px)
const GAME_HEIGHT = 72;  // 螢幕高度 (px)
const GROUND_Y = 56;     // 地面 Y 座標
const GRAVITY = 0.8;     // 重力加速度
const JUMP_FORCE = -9;   // 跳躍力道
const PLAYER_SIZE = 20;  // 角色大小
const OBSTACLE_WIDTH = 8;
const OBSTACLE_HEIGHT = 12;
const OBSTACLE_SPEED = 2.5;
const FRAME_DURATION = 50; // 跳躍時每幀持續時間 (ms)

export type GameState = 'idle' | 'playing' | 'gameover';

interface Obstacle {
  id: number;
  x: number;
  height: number;
}

export interface DinoGameProps {
  /** 是否啟動遊戲 */
  isActive: boolean;
  /** 當前按下的按鈕 */
  pressedButton: PocketConsoleButton | null;
  /** 遊戲結束回調 */
  onGameOver?: (score: number) => void;
  /** 返回選單回調 */
  onBack?: () => void;
  /** 實際螢幕寬度 */
  screenWidth?: number;
  /** 實際螢幕高度 */
  screenHeight?: number;
}

export const DinoGame: React.FC<DinoGameProps> = ({
  isActive,
  pressedButton,
  onGameOver,
  onBack,
  screenWidth = GAME_WIDTH,
  screenHeight = GAME_HEIGHT,
}) => {
  // 計算縮放比例
  const scale = Math.min(screenWidth / GAME_WIDTH, screenHeight / GAME_HEIGHT);
  // 遊戲狀態
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  // 角色狀態
  const [playerY, setPlayerY] = useState(GROUND_Y - PLAYER_SIZE);
  const [isJumping, setIsJumping] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  
  // 障礙物
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  // Refs (使用 ref 來避免 closure 問題)
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const obstacleTimerRef = useRef<number>(0);
  const frameTimerRef = useRef<number>(0);
  const obstacleIdRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const playerYRef = useRef<number>(GROUND_Y - PLAYER_SIZE);
  const isJumpingRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);

  // 跳躍
  const jump = useCallback(() => {
    if (!isJumpingRef.current && gameState === 'playing') {
      velocityRef.current = JUMP_FORCE;
      isJumpingRef.current = true;
      setIsJumping(true);
      setCurrentFrame(0); // 重置 frame 開始動畫
    }
  }, [gameState]);

  // 開始遊戲
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    setPlayerY(GROUND_Y - PLAYER_SIZE);
    playerYRef.current = GROUND_Y - PLAYER_SIZE;
    velocityRef.current = 0;
    isJumpingRef.current = false;
    setIsJumping(false);
    setCurrentFrame(0);
    setObstacles([]);
    obstacleTimerRef.current = 0;
    obstacleIdRef.current = 0;
    frameTimerRef.current = 0;
  }, []);

  // 重置遊戲
  const resetGame = useCallback(() => {
    setGameState('idle');
    setScore(0);
    scoreRef.current = 0;
    setPlayerY(GROUND_Y - PLAYER_SIZE);
    playerYRef.current = GROUND_Y - PLAYER_SIZE;
    velocityRef.current = 0;
    isJumpingRef.current = false;
    setIsJumping(false);
    setCurrentFrame(0);
    setObstacles([]);
  }, []);

  // 處理按鈕輸入
  useEffect(() => {
    if (!isActive) return;

    if (pressedButton === 'a' || pressedButton === 'up') {
      if (gameState === 'idle') {
        startGame();
      } else if (gameState === 'playing') {
        jump();
      } else if (gameState === 'gameover') {
        startGame();
      }
    }

    if (pressedButton === 'b' || pressedButton === 'select') {
      if (gameState === 'idle' || gameState === 'gameover') {
        onBack?.();
      }
    }

    if (pressedButton === 'start') {
      if (gameState === 'gameover') {
        startGame();
      }
    }
  }, [pressedButton, isActive, gameState, jump, startGame, onBack]);

  // 遊戲主循環
  useEffect(() => {
    if (!isActive || gameState !== 'playing') return;

    let obstaclesLocal: Obstacle[] = [];

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // 更新分數
      scoreRef.current += 1;
      setScore(scoreRef.current);

      // 更新角色位置（重力）
      velocityRef.current += GRAVITY;
      playerYRef.current += velocityRef.current;
      
      if (playerYRef.current >= GROUND_Y - PLAYER_SIZE) {
        playerYRef.current = GROUND_Y - PLAYER_SIZE;
        velocityRef.current = 0;
        if (isJumpingRef.current) {
          isJumpingRef.current = false;
          setIsJumping(false);
          setCurrentFrame(0);
          frameTimerRef.current = 0;
        }
      }
      setPlayerY(playerYRef.current);

      // 更新跳躍動畫 frame
      if (isJumpingRef.current) {
        frameTimerRef.current += deltaTime;
        if (frameTimerRef.current >= FRAME_DURATION) {
          frameTimerRef.current = 0;
          setCurrentFrame(prev => {
            const next = prev + 1;
            // loop 一次後停在最後一幀直到落地
            return next < rotationFrames.length ? next : rotationFrames.length - 1;
          });
        }
      }

      // 生成障礙物
      obstacleTimerRef.current += deltaTime;
      const spawnInterval = Math.max(800, 1500 - scoreRef.current * 0.5); // 隨分數加快
      if (obstacleTimerRef.current >= spawnInterval) {
        obstacleTimerRef.current = 0;
        const height = OBSTACLE_HEIGHT + Math.random() * 8;
        obstaclesLocal.push({ id: obstacleIdRef.current++, x: GAME_WIDTH, height });
      }

      // 更新障礙物位置
      const speed = OBSTACLE_SPEED + scoreRef.current * 0.002; // 隨分數加快
      obstaclesLocal = obstaclesLocal
        .map(obs => ({ ...obs, x: obs.x - speed }))
        .filter(obs => obs.x > -OBSTACLE_WIDTH);
      setObstacles([...obstaclesLocal]);

      // 碰撞檢測
      const playerLeft = 10;
      const playerRight = playerLeft + PLAYER_SIZE - 4;
      const playerTop = playerYRef.current;
      const playerBottom = playerYRef.current + PLAYER_SIZE;

      for (const obs of obstaclesLocal) {
        const obsLeft = obs.x;
        const obsRight = obs.x + OBSTACLE_WIDTH;
        const obsTop = GROUND_Y - obs.height;
        const obsBottom = GROUND_Y;

        // AABB 碰撞檢測
        if (
          playerRight > obsLeft &&
          playerLeft < obsRight &&
          playerBottom > obsTop &&
          playerTop < obsBottom
        ) {
          // 碰撞！遊戲結束
          setGameState('gameover');
          setHighScore(prev => Math.max(prev, scoreRef.current));
          onGameOver?.(scoreRef.current);
          return;
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isActive, gameState, onGameOver]);

  // 清理
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // 當遊戲不活躍時重置
  useEffect(() => {
    if (!isActive) {
      resetGame();
    }
  }, [isActive, resetGame]);

  if (!isActive) return null;

  return (
    <div 
      className="dino-game"
      style={{
        width: screenWidth,
        height: screenHeight,
      }}
    >
      {/* 縮放容器 - 使用固定的虛擬尺寸，再用 transform 縮放 */}
      <div 
        className="dino-game__scale-container"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* 閒置畫面 */}
        {gameState === 'idle' && (
          <div className="dino-game__idle">
            <div className="dino-game__title">HARRY RUN</div>
            <div className="dino-game__hint">PRESS A</div>
            <img 
              src={rotationFrames[0]} 
              alt="Harry" 
              className="dino-game__preview"
            />
          </div>
        )}

        {/* 遊戲畫面 */}
        {gameState === 'playing' && (
          <div className="dino-game__screen">
            {/* 分數 */}
            <div className="dino-game__score">{String(score).padStart(5, '0')}</div>
            
            {/* 角色 */}
            <img
              src={rotationFrames[currentFrame]}
              alt="Harry"
              className="dino-game__player"
              style={{
                left: 10,
                top: playerY,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
              }}
            />

            {/* 障礙物 */}
            {obstacles.map(obs => (
              <div
                key={obs.id}
                className="dino-game__obstacle"
                style={{
                  left: obs.x,
                  bottom: GAME_HEIGHT - GROUND_Y,
                  width: OBSTACLE_WIDTH,
                  height: obs.height,
                }}
              />
            ))}

            {/* 地面 */}
            <div 
              className="dino-game__ground"
              style={{ top: GROUND_Y }}
            />
          </div>
        )}

        {/* 遊戲結束畫面 */}
        {gameState === 'gameover' && (
          <div className="dino-game__gameover">
            <div className="dino-game__gameover-title">GAME OVER</div>
            <div className="dino-game__gameover-score">
              SCORE: {score}
            </div>
            <div className="dino-game__gameover-high">
              HIGH: {highScore}
            </div>
            <div className="dino-game__gameover-hint">A:RETRY B:BACK</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DinoGame;
