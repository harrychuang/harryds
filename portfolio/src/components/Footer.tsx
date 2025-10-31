import React, { useMemo, useEffect } from 'react';
import { PixelText2D } from 'hds';
import './Footer.scss';
import { calculatePixelTextWidth } from '../utils/pixelTextUtils';
import { useParams } from 'react-router-dom';
import { useStrapiFeed } from '../hooks/useStrapiFeed';
import type { FeedItem } from 'hds/types/feed';
import { useHover } from '../contexts/HoverContext';
import { useOverlay } from '../contexts/OverlayContext';
import { useScrollProgress } from '../hooks/useScrollProgress';

const Footer: React.FC = () => {
  const params = useParams();
  const { items } = useStrapiFeed();
  const { hoveredCardId } = useHover();
  const { openCardId, animationPhase, overlayScrollRef } = useOverlay();
  const pixelSize = 1;
  const pixelSize2 = 2;
  const leftText = "PROCESS";
  const rightText = "COPYRIGHT © HARRY.DS ALL RIGHTS RESERVED.";
  
  // 決定要監聽的滾動容器：當 overlay 處於 expanding 或 ready 階段時，監聽 overlay 的滾動
  const shouldMonitorOverlay = openCardId && (animationPhase === 'expanding' || animationPhase === 'ready');
  
  // 自動查找 overlay 的滾動容器
  useEffect(() => {
    if (shouldMonitorOverlay) {
      const findOverlayScrollContainer = () => {
        const overlayContent = document.querySelector('.feed-detail-overlay__content') as HTMLDivElement;
        if (overlayContent && overlayScrollRef.current !== overlayContent) {
          overlayScrollRef.current = overlayContent;
        }
      };
      
      // 嘗試立即查找
      findOverlayScrollContainer();
      
      // 如果沒找到，設置一個短暫的輪詢（處理動畫延遲）
      const pollInterval = setInterval(() => {
        if (overlayScrollRef.current) {
          clearInterval(pollInterval);
          return;
        }
        findOverlayScrollContainer();
      }, 50);
      
      // 清理輪詢
      setTimeout(() => clearInterval(pollInterval), 1000);
      
      return () => clearInterval(pollInterval);
    } else {
      // 當不需要監聽 overlay 時，清除 ref
      overlayScrollRef.current = null;
    }
  }, [shouldMonitorOverlay, overlayScrollRef]);
  
  const scrollContainer = shouldMonitorOverlay ? overlayScrollRef.current : null;
  
  const scrollProgress = useScrollProgress({ scrollContainer });
  
  // 格式化百分比文字（確保是3位數，如 "  0%" 或 "100%"）
  const progressText = `${scrollProgress.toString().padStart(3, ' ')}%`;
  
  // 獲取當前活動卡片的顏色（與 Home 組件相同的邏輯）
  const footerColors = useMemo(() => {
    // 首先檢查 URL 中的打開卡片
    let urlOpenCardId: number | null = null;
    const idParam = params.id;
    const category = params.category as 'article' | 'project' | undefined;
    
    if (idParam && category) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        urlOpenCardId = id;
      }
    }
    
    // 使用打開的卡片或懸停的卡片（與 logo 相同的邏輯）
    // 優先使用 Context 中的 openCardId，如果沒有則使用 URL 中的
    const activeCardId = openCardId || urlOpenCardId || hoveredCardId;
    
    if (activeCardId) {
      const activeItem = items.find((item: FeedItem) => item.id === activeCardId);
      if (activeItem && activeItem.primaryColor && activeItem.secondaryColor) {
        return {
          primaryColor: activeItem.primaryColor,
          secondaryColor: activeItem.secondaryColor,
        };
      }
    }
    
    return {};
  }, [params.id, params.category, hoveredCardId, openCardId, items]);
  
  // 計算實際所需的寬度
  const processWidth = calculatePixelTextWidth(leftText, { pixelSize });

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <span
            className="footer__copyright"
            style={{ color: footerColors.primaryColor }}
          >
            {rightText}
          </span>
        </div>
        <div className="footer__right">
          <PixelText2D 
            text={leftText}
            textEnabled 
            pixelSize={pixelSize}
            width={processWidth}
            height={20}
            primaryColor={footerColors.primaryColor}
            onPrimaryColor={footerColors.secondaryColor}
          />
          <PixelText2D 
            text=""
            textEnabled={false}
            textBoxEnabled={true}
            textBox={progressText}
            textBoxWidth={4}
            textBoxPadding={6}
            pixelSize={pixelSize2}
            width={80}
            height={20}
            primaryColor={footerColors.primaryColor}
            onPrimaryColor={footerColors.secondaryColor}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
