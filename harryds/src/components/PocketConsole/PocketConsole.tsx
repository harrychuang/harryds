// =============================================================================
// POCKET CONSOLE 元件
// - GameBoy 風格 8-bit 像素插圖
// - 純 SVG 渲染，支援自訂顏色與動畫
// =============================================================================

import React from 'react';
import './PocketConsole.scss';

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
}

// 像素單位大小
const PX = 4;

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
}) => {
  // 原始 SVG 尺寸 (40 x 64 像素單位，每單位 4px)
  const viewWidth = 40 * PX;
  const viewHeight = 64 * PX;
  const height = (width / viewWidth) * viewHeight;
  const scale = width / viewWidth;

  // 輔助函數：繪製像素矩形
  const px = (x: number, y: number, w: number, h: number, fill: string) => (
    <rect x={x * PX} y={y * PX} width={w * PX} height={h * PX} fill={fill} />
  );

  return (
    <div
      className={`hds-pocket-console ${animated ? 'hds-pocket-console--animated' : ''} ${className}`.trim()}
      style={{ width, height }}
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
          {/* 水平 */}
          {px(6, 40, 10, 4, dpadColor)}
          {/* 垂直 */}
          {px(9, 37, 4, 10, dpadColor)}
          {/* 中心 */}
          {px(10, 40, 2, 4, '#1a1a1a')}
          {/* 方向指示 */}
          {px(10, 38, 2, 1, '#1a1a1a')}
          {px(10, 45, 2, 1, '#1a1a1a')}
          {px(7, 41, 1, 2, '#1a1a1a')}
          {px(14, 41, 1, 2, '#1a1a1a')}
        </g>

        {/* ===== A/B 按鈕 ===== */}
        <g className="hds-pocket-console__buttons">
          {/* B 按鈕 - 使用像素方塊 */}
          <g className="hds-pocket-console__btn-b">
            {px(24, 41, 4, 4, buttonColor)}
            {/* 高光 */}
            {px(24, 41, 4, 1, 'rgba(255,255,255,0.3)')}
            {/* B 字母 */}
            {px(25, 42, 1, 2, '#fff')}
            {px(26, 42, 1, 1, '#fff')}
            {px(26, 43, 1, 1, '#fff')}
          </g>
          
          {/* A 按鈕 */}
          <g className="hds-pocket-console__btn-a">
            {px(30, 38, 4, 4, buttonColor)}
            {/* 高光 */}
            {px(30, 38, 4, 1, 'rgba(255,255,255,0.3)')}
            {/* A 字母 */}
            {px(31, 39, 1, 2, '#fff')}
            {px(32, 39, 1, 1, '#fff')}
            {px(32, 40, 1, 1, '#fff')}
          </g>
        </g>

        {/* ===== SELECT / START 按鈕 ===== */}
        <g className="hds-pocket-console__control-buttons">
          {/* SELECT */}
          {px(13, 50, 5, 2, '#4a4a4a')}
          {/* START */}
          {px(22, 50, 5, 2, '#4a4a4a')}
        </g>
        
        {/* SELECT/START 標籤 */}
        <g fill="#6a6a6a" fontSize="3" className="hds-pocket-console__btn-labels">
          {/* 用像素點表示文字 */}
          {/* SELECT - 簡化點陣 */}
          {px(13, 49, 1, 1, '#5a5a5a')}
          {px(15, 49, 1, 1, '#5a5a5a')}
          {px(17, 49, 1, 1, '#5a5a5a')}
          {/* START - 簡化點陣 */}
          {px(22, 49, 1, 1, '#5a5a5a')}
          {px(24, 49, 1, 1, '#5a5a5a')}
          {px(26, 49, 1, 1, '#5a5a5a')}
        </g>

        {/* ===== 喇叭孔 ===== */}
        <g className="hds-pocket-console__speaker">
          {Array.from({ length: 4 }).map((_, i) => (
            <React.Fragment key={i}>
              {px(28 + i * 2, 55, 1, 4, '#5a5a5a')}
            </React.Fragment>
          ))}
        </g>

      </svg>

      {/* 螢幕自定義內容覆蓋層 */}
      {screenContent && (
        <div
          className="hds-pocket-console__screen-content"
          style={{
            left: 8 * PX * scale,
            top: 9 * PX * scale,
            width: 24 * PX * scale,
            height: 18 * PX * scale,
          }}
        >
          {screenContent}
        </div>
      )}
    </div>
  );
};

export default PocketConsole;
