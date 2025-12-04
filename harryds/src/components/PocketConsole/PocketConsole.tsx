// =============================================================================
// POCKET CONSOLE 元件
// - GameBoy 風格 8-bit 像素插圖
// - 純 SVG 渲染，支援自訂顏色與動畫
// - 支援鍵盤控制
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import './PocketConsole.scss';

/** 按鈕類型 */
export type PocketConsoleButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select';

export interface PocketConsoleProps {
  /** 主機外殼顏色 */
  shellColor?: string;
  /** 螢幕邊框顏色 */
  screenBorderColor?: string;
  /** 螢幕背景顏色 */
  screenColor?: string;
  /** 按鈕顏色 */
  buttonColor?: string;
  /** D-pad 顏色 */
  dpadColor?: string;
  /** 整體寬度（高度會按比例計算） */
  width?: number;
  /** 是否顯示螢幕閃爍動畫 */
  animated?: boolean;
  /** 額外的 CSS 類名 */
  className?: string;
  /** 螢幕上顯示的內容（可選的 React 節點） */
  screenContent?: React.ReactNode;
  /** 按鈕按下時的回調 */
  onButtonPress?: (button: PocketConsoleButton) => void;
  /** 按鈕放開時的回調 */
  onButtonRelease?: (button: PocketConsoleButton) => void;
  /** 是否啟用鍵盤控制（預設為 true） */
  enableKeyboard?: boolean;
}

// 像素單位大小
const PX = 4;

// 鍵盤對應
const KEY_MAP: Record<string, PocketConsoleButton> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyA: 'a',
  KeyB: 'b',
  Enter: 'start',
  Alt: 'select',
};

// 按鈕符號對應
const BUTTON_SYMBOLS: Partial<Record<PocketConsoleButton, string>> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  a: 'A',
  b: 'B',
};

// 最大輸入歷史長度
const MAX_INPUT_HISTORY = 10;

// Konami Code 密碼序列
const KONAMI_CODE = '↑↑↓↓←→←→BA';

export const PocketConsole: React.FC<PocketConsoleProps> = ({
  shellColor = '#c0c0c0',
  screenBorderColor = '#5c5c5c',
  screenColor = '#9bbc0f',
  buttonColor = '#c62d5a',
  dpadColor = '#2d2d2d',
  width = 160,
  animated = false,
  className = '',
  screenContent,
  onButtonPress,
  onButtonRelease,
  enableKeyboard = true,
}) => {
  // 追蹤按下的按鈕
  const [pressedButtons, setPressedButtons] = useState<Set<PocketConsoleButton>>(new Set());
  
  // 追蹤輸入歷史（用於螢幕顯示）
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  
  // 追蹤是否輸入成功（Konami Code）
  const [isSuccess, setIsSuccess] = useState(false);

  // 原始 SVG 尺寸 (40 x 64 像素單位，每單位 4px)
  const viewWidth = 40 * PX;
  const viewHeight = 64 * PX;
  const height = (width / viewWidth) * viewHeight;
  const scale = width / viewWidth;

  // 按下按鈕
  const pressButton = useCallback((button: PocketConsoleButton) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.add(button);
      return newSet;
    });
    
    // SELECT (Option) 清空輸入歷史並重置 success 狀態
    if (button === 'select') {
      setInputHistory([]);
      setIsSuccess(false);
      onButtonPress?.(button);
      return;
    }
    
    // 如果已經成功，忽略其他輸入
    if (isSuccess) {
      onButtonPress?.(button);
      return;
    }
    
    // 如果是方向鍵或 A/B，添加到輸入歷史
    const symbol = BUTTON_SYMBOLS[button];
    if (symbol) {
      setInputHistory(prev => {
        const newHistory = [...prev, symbol];
        // 只保留最後 MAX_INPUT_HISTORY 個
        const trimmedHistory = newHistory.slice(-MAX_INPUT_HISTORY);
        
        // 檢查是否匹配 Konami Code
        const inputString = trimmedHistory.join('');
        if (inputString === KONAMI_CODE) {
          setIsSuccess(true);
        }
        
        return trimmedHistory;
      });
    }
    
    onButtonPress?.(button);
  }, [onButtonPress, isSuccess]);

  // 放開按鈕
  const releaseButton = useCallback((button: PocketConsoleButton) => {
    setPressedButtons(prev => {
      const newSet = new Set(prev);
      newSet.delete(button);
      return newSet;
    });
    onButtonRelease?.(button);
  }, [onButtonRelease]);

  // 鍵盤事件處理
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const button = KEY_MAP[e.code] || KEY_MAP[e.key];
      if (button) {
        e.preventDefault();
        pressButton(button);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const button = KEY_MAP[e.code] || KEY_MAP[e.key];
      if (button) {
        e.preventDefault();
        releaseButton(button);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enableKeyboard, pressButton, releaseButton]);

  // 輔助函數：繪製像素矩形
  const px = (x: number, y: number, w: number, h: number, fill: string) => (
    <rect x={x * PX} y={y * PX} width={w * PX} height={h * PX} fill={fill} />
  );

  // 檢查按鈕是否被按下
  const isPressed = (button: PocketConsoleButton) => pressedButtons.has(button);

  // 滑鼠/觸控事件處理
  const handleMouseDown = (button: PocketConsoleButton) => () => pressButton(button);
  const handleMouseUp = (button: PocketConsoleButton) => () => releaseButton(button);
  const handleMouseLeave = (button: PocketConsoleButton) => () => {
    if (pressedButtons.has(button)) {
      releaseButton(button);
    }
  };

  return (
    <div
      className={`hds-pocket-console ${animated ? 'hds-pocket-console--animated' : ''} ${className}`.trim()}
      style={{ width, height }}
      tabIndex={enableKeyboard ? 0 : undefined}
    >
      <svg
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        className="hds-pocket-console__svg"
        shapeRendering="crispEdges"
      >
        {/* ===== 主機外殼 ===== */}
        <g className="hds-pocket-console__shell">
          {/* 主體 */}
          {px(2, 2, 36, 60, shellColor)}
          {/* 圓角處理 - 左上 */}
          {px(2, 2, 2, 2, 'transparent')}
          {px(3, 2, 1, 1, 'transparent')}
          {px(2, 3, 1, 1, 'transparent')}
          {/* 圓角處理 - 右上 */}
          {px(36, 2, 2, 2, 'transparent')}
          {px(36, 2, 1, 1, 'transparent')}
          {px(37, 3, 1, 1, 'transparent')}
          {/* 圓角處理 - 左下 */}
          {px(2, 60, 2, 2, 'transparent')}
          {px(2, 61, 1, 1, 'transparent')}
          {px(3, 62, 1, 1, 'transparent')}
          {/* 圓角處理 - 右下 */}
          {px(36, 60, 2, 2, 'transparent')}
          {px(37, 61, 1, 1, 'transparent')}
          {px(36, 62, 1, 1, 'transparent')}
          
          {/* 外殼高光 */}
          {px(4, 4, 32, 1, 'rgba(255,255,255,0.3)')}
          {px(4, 5, 1, 26, 'rgba(255,255,255,0.2)')}
        </g>

        {/* ===== 螢幕區域 ===== */}
        <g className="hds-pocket-console__screen-area">
          {/* 螢幕外框 */}
          {px(5, 6, 30, 24, screenBorderColor)}
          {/* 螢幕內框（深綠） */}
          {px(7, 8, 26, 20, '#0f380f')}
          {/* 螢幕顯示區 */}
          <rect
            x={8 * PX}
            y={9 * PX}
            width={24 * PX}
            height={18 * PX}
            fill={screenColor}
            className="hds-pocket-console__screen"
          />
          
          {/* 螢幕掃描線 */}
          <g className="hds-pocket-console__scanlines" opacity="0.15">
            {Array.from({ length: 9 }).map((_, i) => (
              <rect
                key={i}
                x={8 * PX}
                y={(9 + i * 2) * PX}
                width={24 * PX}
                height={PX}
                fill="#000"
              />
            ))}
          </g>
        </g>

        {/* 電源指示燈 */}
        <rect
          x={6 * PX}
          y={31 * PX}
          width={2 * PX}
          height={2 * PX}
          fill={animated ? '#ff0044' : '#660022'}
          className="hds-pocket-console__power-led"
        />

        {/* ===== D-PAD (十字鍵) ===== */}
        <g className="hds-pocket-console__dpad">
          {/* 上 */}
          <g
            className={`hds-pocket-console__dpad-up ${isPressed('up') ? 'hds-pocket-console__dpad-up--pressed' : ''}`}
            onMouseDown={handleMouseDown('up')}
            onMouseUp={handleMouseUp('up')}
            onMouseLeave={handleMouseLeave('up')}
            onTouchStart={handleMouseDown('up')}
            onTouchEnd={handleMouseUp('up')}
          >
            {px(9, 37, 4, 3, dpadColor)}
            {/* 方向指示箭頭 */}
            {px(10, 38, 2, 1, '#1a1a1a')}
          </g>
          
          {/* 下 */}
          <g
            className={`hds-pocket-console__dpad-down ${isPressed('down') ? 'hds-pocket-console__dpad-down--pressed' : ''}`}
            onMouseDown={handleMouseDown('down')}
            onMouseUp={handleMouseUp('down')}
            onMouseLeave={handleMouseLeave('down')}
            onTouchStart={handleMouseDown('down')}
            onTouchEnd={handleMouseUp('down')}
          >
            {px(9, 44, 4, 3, dpadColor)}
            {/* 方向指示箭頭 */}
            {px(10, 45, 2, 1, '#1a1a1a')}
          </g>
          
          {/* 左 */}
          <g
            className={`hds-pocket-console__dpad-left ${isPressed('left') ? 'hds-pocket-console__dpad-left--pressed' : ''}`}
            onMouseDown={handleMouseDown('left')}
            onMouseUp={handleMouseUp('left')}
            onMouseLeave={handleMouseLeave('left')}
            onTouchStart={handleMouseDown('left')}
            onTouchEnd={handleMouseUp('left')}
          >
            {px(6, 40, 3, 4, dpadColor)}
            {/* 方向指示箭頭 */}
            {px(7, 41, 1, 2, '#1a1a1a')}
          </g>
          
          {/* 右 */}
          <g
            className={`hds-pocket-console__dpad-right ${isPressed('right') ? 'hds-pocket-console__dpad-right--pressed' : ''}`}
            onMouseDown={handleMouseDown('right')}
            onMouseUp={handleMouseUp('right')}
            onMouseLeave={handleMouseLeave('right')}
            onTouchStart={handleMouseDown('right')}
            onTouchEnd={handleMouseUp('right')}
          >
            {px(13, 40, 3, 4, dpadColor)}
            {/* 方向指示箭頭 */}
            {px(14, 41, 1, 2, '#1a1a1a')}
          </g>
          
          {/* 中心 */}
          <g className="hds-pocket-console__dpad-center">
            {px(9, 40, 4, 4, dpadColor)}
            {px(10, 41, 2, 2, '#1a1a1a')}
          </g>
        </g>

        {/* ===== A/B 按鈕 ===== */}
        <g className="hds-pocket-console__buttons">
          {/* B 按鈕 */}
          <g
            className={`hds-pocket-console__btn-b ${isPressed('b') ? 'hds-pocket-console__btn-b--pressed' : ''}`}
            onMouseDown={handleMouseDown('b')}
            onMouseUp={handleMouseUp('b')}
            onMouseLeave={handleMouseLeave('b')}
            onTouchStart={handleMouseDown('b')}
            onTouchEnd={handleMouseUp('b')}
          >
            {px(24, 41, 4, 4, buttonColor)}
          </g>
          {/* B 標籤 */}
          <text
            x={26 * PX}
            y={47 * PX}
            className="hds-pocket-console__btn-label"
            textAnchor="middle"
          >
            B
          </text>
          
          {/* A 按鈕 */}
          <g
            className={`hds-pocket-console__btn-a ${isPressed('a') ? 'hds-pocket-console__btn-a--pressed' : ''}`}
            onMouseDown={handleMouseDown('a')}
            onMouseUp={handleMouseUp('a')}
            onMouseLeave={handleMouseLeave('a')}
            onTouchStart={handleMouseDown('a')}
            onTouchEnd={handleMouseUp('a')}
          >
            {px(30, 38, 4, 4, buttonColor)}
          </g>
          {/* A 標籤 */}
          <text
            x={32 * PX}
            y={44 * PX}
            className="hds-pocket-console__btn-label"
            textAnchor="middle"
          >
            A
          </text>
        </g>

        {/* ===== SELECT / START 按鈕 ===== */}
        <g className="hds-pocket-console__control-buttons">
          {/* SELECT */}
          <g
            className={`hds-pocket-console__btn-select ${isPressed('select') ? 'hds-pocket-console__btn-select--pressed' : ''}`}
            onMouseDown={handleMouseDown('select')}
            onMouseUp={handleMouseUp('select')}
            onMouseLeave={handleMouseLeave('select')}
            onTouchStart={handleMouseDown('select')}
            onTouchEnd={handleMouseUp('select')}
          >
            {px(13, 50, 5, 2, '#4a4a4a')}
          </g>
          {/* SELECT 標籤 */}
          <text
            x={15.5 * PX}
            y={54 * PX}
            className="hds-pocket-console__btn-label hds-pocket-console__btn-label--small"
            textAnchor="middle"
          >
            SELECT
          </text>
          
          {/* START */}
          <g
            className={`hds-pocket-console__btn-start ${isPressed('start') ? 'hds-pocket-console__btn-start--pressed' : ''}`}
            onMouseDown={handleMouseDown('start')}
            onMouseUp={handleMouseUp('start')}
            onMouseLeave={handleMouseLeave('start')}
            onTouchStart={handleMouseDown('start')}
            onTouchEnd={handleMouseUp('start')}
          >
            {px(22, 50, 5, 2, '#4a4a4a')}
          </g>
          {/* START 標籤 */}
          <text
            x={24.5 * PX}
            y={54 * PX}
            className="hds-pocket-console__btn-label hds-pocket-console__btn-label--small"
            textAnchor="middle"
          >
            START
          </text>
        </g>

        {/* ===== 喇叭孔 ===== */}
        <g className="hds-pocket-console__speaker">
          {Array.from({ length: 4 }).map((_, i) => (
            <React.Fragment key={i}>
              {px(28 + i * 2, 55, 1, 4, '#ABABAB')}
            </React.Fragment>
          ))}
        </g>

      </svg>

      {/* 螢幕自定義內容覆蓋層 */}
      <div
        className="hds-pocket-console__screen-content"
        style={{
          left: 8 * PX * scale,
          top: 9 * PX * scale,
          width: 24 * PX * scale,
          height: 18 * PX * scale,
        }}
      >
        {isSuccess ? (
          <div className="hds-pocket-console__success">
            SUCCESS!
          </div>
        ) : inputHistory.length > 0 ? (
          <div className="hds-pocket-console__input-display">
            {inputHistory.join('')}
          </div>
        ) : (
          screenContent
        )}
      </div>
    </div>
  );
};

export default PocketConsole;
