import React, { useMemo } from 'react';
import { PixelText } from 'hds';
import './Footer.scss';
import { calculatePixelTextWidth } from '../utils/pixelTextUtils';
import { useParams } from 'react-router-dom';
import { useStrapiFeed } from '../hooks/useStrapiFeed';
import type { FeedItem } from 'hds/types/feed';
import { useHover } from '../contexts/HoverContext';
import { useScrollProgress } from '../hooks/useScrollProgress';

const Footer: React.FC = () => {
  const params = useParams();
  const { items } = useStrapiFeed();
  const { hoveredCardId } = useHover();
  const scrollProgress = useScrollProgress();
  const pixelSize = 1;
  const pixelSize2 = 2;
  const leftText = "PROCESS";
  const rightText = "COPYRIGHT © HARRY.DS ALL RIGHTS RESERVED.";
  
  // 格式化百分比文字（確保是3位數，如 "  0%" 或 "100%"）
  const progressText = `${scrollProgress.toString().padStart(3, ' ')}%`;
  
  // 獲取當前活動卡片的顏色（與 Home 組件相同的邏輯）
  const footerColors = useMemo(() => {
    // 首先檢查 URL 中的打開卡片
    let openCardId: number | null = null;
    const idParam = params.id;
    const category = params.category as 'article' | 'project' | undefined;
    
    if (idParam && category) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        openCardId = id;
      }
    }
    
    // 使用打開的卡片或懸停的卡片（與 logo 相同的邏輯）
    const activeCardId = openCardId || hoveredCardId;
    
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
  }, [params.id, params.category, hoveredCardId, items]);
  
  // 計算實際所需的寬度
  const processWidth = calculatePixelTextWidth(leftText, { pixelSize });
  const rightWidth = calculatePixelTextWidth(rightText, { pixelSize });

  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__left">
          <PixelText 
            text={leftText}
            textEnabled 
            pixelSize={pixelSize}
            width={processWidth}
            height={20}
            primaryColor={footerColors.primaryColor}
            onPrimaryColor={footerColors.secondaryColor}
          />
          <PixelText 
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
        <div className="footer__right">
          <PixelText 
            text={rightText}
            textEnabled 
            pixelSize={pixelSize}
            width={rightWidth}
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
