// =============================================================================
// PONG GAME - 乒乓遊戲
// - 使用 HarryAnimation rotation frames 作為玩家板子
// - 上下移動時 frame 會 loop
// - 對抗 AI
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
const GAME_WIDTH = 96;
const GAME_HEIGHT = 72;
const PADDLE_WIDTH = 16;
const PADDLE_HEIGHT = 4;
const PADDLE_SPEED = 3;
const BALL_SIZE = 4;
const BALL_SPEED_INITIAL = 1.5;
const BALL_SPEED_INCREMENT = 0.1;
const AI_SPEED = 2;
const FRAME_DURATION = 80; // 移動時每幀持續時間 (ms)
const WIN_SCORE = 5;

export type PongGameState = 'idle' | 'playing' | 'gameover';

export interface PongGameProps {
  /** 是否啟動遊戲 */
  isActive: boolean;
  /** 當前按下的按鈕 */
  pressedButton: PocketConsoleButton | null;
  /** 遊戲結束回調 */
  onGameOver?: (playerScore: number, aiScore: number) => void;
  /** 返回選單回調 */
  onBack?: () => void;
  /** 實際螢幕寬度 */
  screenWidth?: number;
  /** 實際螢幕高度 */
  screenHeight?: number;
}

export const PongGame: React.FC<PongGameProps> = ({
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
  const [gameState, setGameState] = useState<PongGameState>('idle');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);

  // 玩家板子狀態
  const [playerY, setPlayerY] = useState((GAME_HEIGHT - PADDLE_WIDTH) / 2);
  const [currentFrame, setCurrentFrame] = useState(0);

  // AI 板子狀態
  const [aiY, setAiY] = useState((GAME_HEIGHT - PADDLE_WIDTH) / 2);

  // 球狀態
  const [ballX, setBallX] = useState(GAME_WIDTH / 2 - BALL_SIZE / 2);
  const [ballY, setBallY] = useState(GAME_HEIGHT / 2 - BALL_SIZE / 2);

  // Refs
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameTimerRef = useRef<number>(0);
  const ballVelXRef = useRef<number>(BALL_SPEED_INITIAL);
  const ballVelYRef = useRef<number>(BALL_SPEED_INITIAL * (Math.random() > 0.5 ? 1 : -1));
  const ballXRef = useRef<number>(GAME_WIDTH / 2 - BALL_SIZE / 2);
  const ballYRef = useRef<number>(GAME_HEIGHT / 2 - BALL_SIZE / 2);
  const playerYRef = useRef<number>((GAME_HEIGHT - PADDLE_WIDTH) / 2);
  const aiYRef = useRef<number>((GAME_HEIGHT - PADDLE_WIDTH) / 2);
  const playerScoreRef = useRef<number>(0);
  const aiScoreRef = useRef<number>(0);
  const moveDirectionRef = useRef<'up' | 'down' | null>(null);

  // 重置球位置
  const resetBall = useCallback((direction: 1 | -1 = 1) => {
    ballXRef.current = GAME_WIDTH / 2 - BALL_SIZE / 2;
    ballYRef.current = GAME_HEIGHT / 2 - BALL_SIZE / 2;
    setBallX(ballXRef.current);
    setBallY(ballYRef.current);
    
    const speed = BALL_SPEED_INITIAL + Math.max(playerScoreRef.current, aiScoreRef.current) * BALL_SPEED_INCREMENT;
    ballVelXRef.current = speed * direction;
    ballVelYRef.current = speed * (Math.random() > 0.5 ? 1 : -1) * 0.5;
  }, []);

  // 開始遊戲
  const startGame = useCallback(() => {
    setGameState('playing');
    setPlayerScore(0);
    setAiScore(0);
    playerScoreRef.current = 0;
    aiScoreRef.current = 0;
    setWinner(null);
    
    playerYRef.current = (GAME_HEIGHT - PADDLE_WIDTH) / 2;
    aiYRef.current = (GAME_HEIGHT - PADDLE_WIDTH) / 2;
    setPlayerY(playerYRef.current);
    setAiY(aiYRef.current);
    
    resetBall(Math.random() > 0.5 ? 1 : -1);
    setCurrentFrame(0);
    frameTimerRef.current = 0;
  }, [resetBall]);

  // 重置遊戲
  const resetGame = useCallback(() => {
    setGameState('idle');
    setPlayerScore(0);
    setAiScore(0);
    playerScoreRef.current = 0;
    aiScoreRef.current = 0;
    setWinner(null);
    
    playerYRef.current = (GAME_HEIGHT - PADDLE_WIDTH) / 2;
    aiYRef.current = (GAME_HEIGHT - PADDLE_WIDTH) / 2;
    setPlayerY(playerYRef.current);
    setAiY(aiYRef.current);
    
    ballXRef.current = GAME_WIDTH / 2 - BALL_SIZE / 2;
    ballYRef.current = GAME_HEIGHT / 2 - BALL_SIZE / 2;
    setBallX(ballXRef.current);
    setBallY(ballYRef.current);
    
    setCurrentFrame(0);
  }, []);

  // 處理按鈕輸入
  useEffect(() => {
    if (!isActive) return;

    if (pressedButton === 'a' || pressedButton === 'start') {
      if (gameState === 'idle') {
        startGame();
      }
    }

    if (pressedButton === 'select') {
      if (gameState === 'gameover') {
        startGame();
      }
    }

    if (pressedButton === 'b') {
      if (gameState === 'idle' || gameState === 'gameover') {
        onBack?.();
      }
    }

    // 移動方向
    if (pressedButton === 'up') {
      moveDirectionRef.current = 'up';
    } else if (pressedButton === 'down') {
      moveDirectionRef.current = 'down';
    } else if (pressedButton === null) {
      moveDirectionRef.current = null;
    }
  }, [pressedButton, isActive, gameState, startGame, onBack]);

  // 遊戲主循環
  useEffect(() => {
    if (!isActive || gameState !== 'playing') return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // 更新玩家位置
      if (moveDirectionRef.current === 'up') {
        playerYRef.current = Math.max(0, playerYRef.current - PADDLE_SPEED);
      } else if (moveDirectionRef.current === 'down') {
        playerYRef.current = Math.min(GAME_HEIGHT - PADDLE_WIDTH, playerYRef.current + PADDLE_SPEED);
      }
      setPlayerY(playerYRef.current);

      // 更新玩家動畫 frame（移動時 loop）
      if (moveDirectionRef.current) {
        frameTimerRef.current += deltaTime;
        if (frameTimerRef.current >= FRAME_DURATION) {
          frameTimerRef.current = 0;
          setCurrentFrame(prev => (prev + 1) % rotationFrames.length);
        }
      }

      // AI 追蹤球
      const aiCenter = aiYRef.current + PADDLE_WIDTH / 2;
      const ballCenter = ballYRef.current + BALL_SIZE / 2;
      if (aiCenter < ballCenter - 2) {
        aiYRef.current = Math.min(GAME_HEIGHT - PADDLE_WIDTH, aiYRef.current + AI_SPEED);
      } else if (aiCenter > ballCenter + 2) {
        aiYRef.current = Math.max(0, aiYRef.current - AI_SPEED);
      }
      setAiY(aiYRef.current);

      // 更新球位置
      ballXRef.current += ballVelXRef.current;
      ballYRef.current += ballVelYRef.current;

      // 上下邊界反彈
      if (ballYRef.current <= 0 || ballYRef.current >= GAME_HEIGHT - BALL_SIZE) {
        ballVelYRef.current *= -1;
        ballYRef.current = Math.max(0, Math.min(GAME_HEIGHT - BALL_SIZE, ballYRef.current));
      }

      // 玩家板子碰撞（左側）
      if (
        ballXRef.current <= PADDLE_HEIGHT + 2 &&
        ballXRef.current >= 0 &&
        ballYRef.current + BALL_SIZE >= playerYRef.current &&
        ballYRef.current <= playerYRef.current + PADDLE_WIDTH
      ) {
        ballVelXRef.current = Math.abs(ballVelXRef.current) * 1.05; // 加速
        // 根據擊中位置調整 Y 速度
        const hitPos = (ballYRef.current + BALL_SIZE / 2 - playerYRef.current) / PADDLE_WIDTH;
        ballVelYRef.current = (hitPos - 0.5) * 3;
        ballXRef.current = PADDLE_HEIGHT + 3;
      }

      // AI 板子碰撞（右側）
      if (
        ballXRef.current >= GAME_WIDTH - PADDLE_HEIGHT - BALL_SIZE - 2 &&
        ballXRef.current <= GAME_WIDTH - BALL_SIZE &&
        ballYRef.current + BALL_SIZE >= aiYRef.current &&
        ballYRef.current <= aiYRef.current + PADDLE_WIDTH
      ) {
        ballVelXRef.current = -Math.abs(ballVelXRef.current) * 1.05; // 加速
        const hitPos = (ballYRef.current + BALL_SIZE / 2 - aiYRef.current) / PADDLE_WIDTH;
        ballVelYRef.current = (hitPos - 0.5) * 3;
        ballXRef.current = GAME_WIDTH - PADDLE_HEIGHT - BALL_SIZE - 3;
      }

      // 左邊界（AI 得分）
      if (ballXRef.current < -BALL_SIZE) {
        aiScoreRef.current += 1;
        setAiScore(aiScoreRef.current);
        if (aiScoreRef.current >= WIN_SCORE) {
          setGameState('gameover');
          setWinner('ai');
          onGameOver?.(playerScoreRef.current, aiScoreRef.current);
          return;
        }
        resetBall(-1);
      }

      // 右邊界（玩家得分）
      if (ballXRef.current > GAME_WIDTH) {
        playerScoreRef.current += 1;
        setPlayerScore(playerScoreRef.current);
        if (playerScoreRef.current >= WIN_SCORE) {
          setGameState('gameover');
          setWinner('player');
          onGameOver?.(playerScoreRef.current, aiScoreRef.current);
          return;
        }
        resetBall(1);
      }

      setBallX(ballXRef.current);
      setBallY(ballYRef.current);

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isActive, gameState, resetBall, onGameOver]);

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
      className="pong-game"
      style={{
        width: screenWidth,
        height: screenHeight,
      }}
    >
      <div
        className="pong-game__scale-container"
        style={{
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* 閒置畫面 */}
        {gameState === 'idle' && (
          <div className="pong-game__idle">
            <div className="pong-game__title">HARRY PONG</div>
            <div className="pong-game__hint">PRESS A</div>
            <div className="pong-game__controls">↑↓:MOVE</div>
          </div>
        )}

        {/* 遊戲畫面 */}
        {gameState === 'playing' && (
          <div className="pong-game__screen">
            {/* 分數 */}
            <div className="pong-game__scores">
              <span className="pong-game__score-player">{playerScore}</span>
              <span className="pong-game__score-divider">-</span>
              <span className="pong-game__score-ai">{aiScore}</span>
            </div>

            {/* 中線 */}
            <div className="pong-game__center-line" />

            {/* 玩家板子 (Harry) */}
            <img
              src={rotationFrames[currentFrame]}
              alt="Player"
              className="pong-game__paddle-player"
              style={{
                left: 2,
                top: playerY,
                width: PADDLE_HEIGHT,
                height: PADDLE_WIDTH,
              }}
            />

            {/* AI 板子 */}
            <div
              className="pong-game__paddle-ai"
              style={{
                right: 2,
                top: aiY,
                width: PADDLE_HEIGHT,
                height: PADDLE_WIDTH,
              }}
            />

            {/* 球 */}
            <div
              className="pong-game__ball"
              style={{
                left: ballX,
                top: ballY,
                width: BALL_SIZE,
                height: BALL_SIZE,
              }}
            />
          </div>
        )}

        {/* 遊戲結束畫面 */}
        {gameState === 'gameover' && (
          <div className="pong-game__gameover">
            <div className="pong-game__gameover-title">
              {winner === 'player' ? 'YOU WIN!' : 'YOU LOSE'}
            </div>
            <div className="pong-game__gameover-score">
              {playerScore} - {aiScore}
            </div>
            <div className="pong-game__gameover-hint">SEL:RETRY B:BACK</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PongGame;
