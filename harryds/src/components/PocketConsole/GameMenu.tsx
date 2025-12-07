// =============================================================================
// GAME MENU - 遊戲選擇選單
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import type { PocketConsoleButton } from './PocketConsole';

export type GameType = 'harry-run' | 'harry-pong';

export interface GameMenuItem {
  id: GameType;
  name: string;
  description: string;
}

const GAMES: GameMenuItem[] = [
  { id: 'harry-run', name: 'HARRY RUN', description: 'JUMP TO SURVIVE' },
  { id: 'harry-pong', name: 'HARRY PONG', description: 'CLASSIC PONG' },
];

// 選單常數
const MENU_WIDTH = 96;
const MENU_HEIGHT = 72;

export interface GameMenuProps {
  /** 是否啟動選單 */
  isActive: boolean;
  /** 當前按下的按鈕 */
  pressedButton: PocketConsoleButton | null;
  /** 選擇遊戲回調 */
  onSelectGame: (game: GameType) => void;
  /** 返回回調 */
  onBack: () => void;
  /** 實際螢幕寬度 */
  screenWidth?: number;
  /** 實際螢幕高度 */
  screenHeight?: number;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  isActive,
  pressedButton,
  onSelectGame,
  onBack,
  screenWidth = MENU_WIDTH,
  screenHeight = MENU_HEIGHT,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIndexRef = useRef(0);
  
  // 計算縮放比例
  const scale = Math.min(screenWidth / MENU_WIDTH, screenHeight / MENU_HEIGHT);

  // 同步 ref 與 state
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  // 處理按鈕輸入
  useEffect(() => {
    if (!isActive || !pressedButton) return;

    if (pressedButton === 'up') {
      setSelectedIndex(prev => (prev - 1 + GAMES.length) % GAMES.length);
    }

    if (pressedButton === 'down') {
      setSelectedIndex(prev => (prev + 1) % GAMES.length);
    }

    // 只用 A 鍵選擇遊戲，避免 START 開啟選單時的雙重觸發
    if (pressedButton === 'a') {
      onSelectGame(GAMES[selectedIndexRef.current].id);
    }

    if (pressedButton === 'b') {
      onBack();
    }
  }, [pressedButton, isActive, onSelectGame, onBack]);

  // 重置選擇當選單關閉時
  useEffect(() => {
    if (!isActive) {
      setSelectedIndex(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div 
      className="game-menu"
      style={{
        width: screenWidth,
        height: screenHeight,
      }}
    >
      <div 
        className="game-menu__scale-container"
        style={{
          width: MENU_WIDTH,
          height: MENU_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div className="game-menu__content">
          <div className="game-menu__title">SELECT GAME</div>
          <div className="game-menu__list">
            {GAMES.map((game, index) => (
              <div
                key={game.id}
                className={`game-menu__item ${index === selectedIndex ? 'game-menu__item--selected' : ''}`}
              >
                <span className="game-menu__cursor">
                  {index === selectedIndex ? '>' : ' '}
                </span>
                <span className="game-menu__name">{game.name}</span>
              </div>
            ))}
          </div>
          <div className="game-menu__hint">A:SELECT B:BACK</div>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
