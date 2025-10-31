import React, { useMemo, useEffect } from 'react';
import './Footer.scss';
import { useParams } from 'react-router-dom';
import { useStrapiFeed } from '../hooks/useStrapiFeed';
import type { FeedItem } from 'hds/types/feed';
import { useHover } from '../contexts/HoverContext';
import { useOverlay } from '../contexts/OverlayContext';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useTheme } from '../theme/useTheme';
import ScrollIndicator from './ScrollIndicator';

const Footer: React.FC = () => {
  const params = useParams();
  const { items } = useStrapiFeed();
  const { hoveredCardId } = useHover();
  const { openCardId, animationPhase, overlayScrollRef } = useOverlay();
  const { theme } = useTheme();
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

  // 決定 ScrollIndicator 和 Copyright 的顏色：有 primaryColor 時使用，沒有時使用 CSS 變數
  const displayColor = footerColors.primaryColor || 'var(--hds-sys-color-theme-surface)';
  const displaySecondaryColor = footerColors.secondaryColor || 'var(--on-hds-sys-color-theme-surface)';

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <span
            className="footer__copyright"
            style={{ color: displayColor }}
          >
            {rightText}
          </span>
        </div>
        <div className="footer__right">
          <ScrollIndicator 
            scrollProgress={scrollProgress}
            primaryColor={displayColor}
            secondaryColor={displaySecondaryColor}
            scrollContainer={scrollContainer}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
