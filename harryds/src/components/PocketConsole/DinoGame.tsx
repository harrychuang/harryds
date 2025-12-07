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
  const currentFrameRef = useRef<number>(0);
  const scoreUpdateTimerRef = useRef<number>(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastObstacleCountRef = useRef<number>(0);

  // 跳躍
  const jump = useCallback(() => {
    if (!isJumpingRef.current && gameState === 'playing') {
      velocityRef.current = JUMP_FORCE;
      isJumpingRef.current = true;
      currentFrameRef.current = 0;
      frameTimerRef.current = 0;
      // 立即更新 UI
      setIsJumping(true);
      setCurrentFrame(0);
    }
  }, [gameState]);

  // 開始遊戲
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    scoreUpdateTimerRef.current = 0;
    setPlayerY(GROUND_Y - PLAYER_SIZE);
    playerYRef.current = GROUND_Y - PLAYER_SIZE;
    velocityRef.current = 0;
    isJumpingRef.current = false;
    currentFrameRef.current = 0;
    setIsJumping(false);
    setCurrentFrame(0);
    setObstacles([]);
    obstaclesRef.current = [];
    lastObstacleCountRef.current = 0;
    obstacleTimerRef.current = 0;
    obstacleIdRef.current = 0;
    frameTimerRef.current = 0;
  }, []);

  // 重置遊戲
  const resetGame = useCallback(() => {
    setGameState('idle');
    setScore(0);
    scoreRef.current = 0;
    scoreUpdateTimerRef.current = 0;
    setPlayerY(GROUND_Y - PLAYER_SIZE);
    playerYRef.current = GROUND_Y - PLAYER_SIZE;
    velocityRef.current = 0;
    isJumpingRef.current = false;
    currentFrameRef.current = 0;
    setIsJumping(false);
    setCurrentFrame(0);
    setObstacles([]);
    obstaclesRef.current = [];
    lastObstacleCountRef.current = 0;
  }, []);

  // 處理按鈕輸入
  useEffect(() => {
    if (!isActive) return;

    if (pressedButton === 'a' || pressedButton === 'up') {
      if (gameState === 'idle') {
        startGame();
      } else if (gameState === 'playing') {
        jump();
      }
      // gameover 時 A 不做任何事，避免誤觸
    }

    if (pressedButton === 'b') {
      if (gameState === 'idle' || gameState === 'gameover') {
        onBack?.();
      }
    }

    // SELECT (Option) 重試遊戲
    if (pressedButton === 'select' || pressedButton === 'start') {
      if (gameState === 'gameover') {
        startGame();
      }
    }
  }, [pressedButton, isActive, gameState, jump, startGame, onBack]);

  // 遊戲主循環
  useEffect(() => {
    if (!isActive || gameState !== 'playing') return;

    obstaclesRef.current = [];
    lastObstacleCountRef.current = 0;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // 更新分數（每幀增加，但每 100ms 才更新 UI）
      scoreRef.current += 1;
      scoreUpdateTimerRef.current += deltaTime;
      if (scoreUpdateTimerRef.current >= 100) {
        scoreUpdateTimerRef.current = 0;
        setScore(scoreRef.current);
      }

      // 更新角色位置（重力）
      velocityRef.current += GRAVITY;
      playerYRef.current += velocityRef.current;
      
      let needUpdateUI = false;
      
      if (playerYRef.current >= GROUND_Y - PLAYER_SIZE) {
        playerYRef.current = GROUND_Y - PLAYER_SIZE;
        velocityRef.current = 0;
        if (isJumpingRef.current) {
          isJumpingRef.current = false;
          currentFrameRef.current = 0;
          frameTimerRef.current = 0;
          needUpdateUI = true;
        }
      }

      // 更新跳躍動畫 frame
      if (isJumpingRef.current) {
        frameTimerRef.current += deltaTime;
        if (frameTimerRef.current >= FRAME_DURATION) {
          frameTimerRef.current = 0;
          const nextFrame = currentFrameRef.current + 1;
          currentFrameRef.current = nextFrame < rotationFrames.length ? nextFrame : rotationFrames.length - 1;
          needUpdateUI = true;
        }
      }

      // 生成障礙物
      obstacleTimerRef.current += deltaTime;
      const spawnInterval = Math.max(800, 1500 - scoreRef.current * 0.5);
      if (obstacleTimerRef.current >= spawnInterval) {
        obstacleTimerRef.current = 0;
        const height = OBSTACLE_HEIGHT + Math.random() * 8;
        obstaclesRef.current.push({ id: obstacleIdRef.current++, x: GAME_WIDTH, height });
      }

      // 更新障礙物位置
      const speed = OBSTACLE_SPEED + scoreRef.current * 0.002;
      obstaclesRef.current = obstaclesRef.current
        .map(obs => ({ ...obs, x: obs.x - speed }))
        .filter(obs => obs.x > -OBSTACLE_WIDTH);

      // 只在障礙物數量變化時更新 state，或者定期更新位置
      const obstacleCountChanged = obstaclesRef.current.length !== lastObstacleCountRef.current;
      lastObstacleCountRef.current = obstaclesRef.current.length;

      // 碰撞檢測
      const playerLeft = 10;
      const playerRight = playerLeft + PLAYER_SIZE - 4;
      const playerTop = playerYRef.current;
      const playerBottom = playerYRef.current + PLAYER_SIZE;

      for (const obs of obstaclesRef.current) {
        const obsLeft = obs.x;
        const obsRight = obs.x + OBSTACLE_WIDTH;
        const obsTop = GROUND_Y - obs.height;
        const obsBottom = GROUND_Y;

        if (
          playerRight > obsLeft &&
          playerLeft < obsRight &&
          playerBottom > obsTop &&
          playerTop < obsBottom
        ) {
          setGameState('gameover');
          setHighScore(prev => Math.max(prev, scoreRef.current));
          setScore(scoreRef.current);
          onGameOver?.(scoreRef.current);
          return;
        }
      }

      // 批次更新 UI（減少重繪次數）
      if (needUpdateUI || obstacleCountChanged) {
        setPlayerY(playerYRef.current);
        setCurrentFrame(currentFrameRef.current);
        setIsJumping(isJumpingRef.current);
        setObstacles([...obstaclesRef.current]);
      } else {
        // 最少每 2 幀更新一次位置，保持流暢
        setPlayerY(playerYRef.current);
        setObstacles([...obstaclesRef.current]);
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
            <div className="dino-game__gameover-hint">SEL:RETRY B:BACK</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DinoGame;
