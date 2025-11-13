import React, { useRef } from 'react';
import './ProjectDetailPage.scss';
import type { FeedItem, FeedContentBlock } from 'hds/types/feed';
import { DistortedPixels2D, VideoPlayer } from 'hds';

export interface ProjectDetailPageProps {
  /** 專案資料（已經包含翻譯） */
  item: FeedItem;
  /** 關閉回調 */
  onClose?: () => void;
  /** 額外類名 */
  className?: string;
}

/**
 * ProjectDetailPage - Portfolio 獨立的專案內容頁元件
 * 
 * 設計目標：
 * - 從 FeedDetailOverlay 抽離內容渲染邏輯
 * - 提供更大的設計自由度
 * - 簡化結構，專注於內容呈現
 * - 支援多語系 i18n（資料由 useI18nFeed 提供）
 */
export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  item,
  className = '',
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 智能分組連續圖片
  const groupImages = (blocks: FeedContentBlock[]) => {
    const result: (FeedContentBlock | FeedContentBlock[])[] = [];
    let imageBuffer: FeedContentBlock[] = [];

    blocks.forEach((block, index) => {
      if (block.type === 'image') {
        imageBuffer.push(block);
        
        // 如果是最後一個區塊，或下一個不是圖片，則輸出緩存
        const isLast = index === blocks.length - 1;
        const nextIsNotImage = !isLast && blocks[index + 1].type !== 'image';
        
        if (isLast || nextIsNotImage) {
          if (imageBuffer.length === 1) {
            result.push(imageBuffer[0]);
          } else {
            result.push([...imageBuffer]);
          }
          imageBuffer = [];
        }
      } else {
        result.push(block);
      }
    });

    return result;
  };

  const renderContentBlocks = (blocks: FeedContentBlock[]) => {
    const grouped = groupImages(blocks);
    
    return grouped.map((groupItem, index) => {
      // 單一區塊
      if (!Array.isArray(groupItem)) {
        const block = groupItem;
        switch (block.type) {
          case 'heading':
            const level = block.level ?? 2;
            const Tag = `h${level}` as keyof JSX.IntrinsicElements;
            return <Tag key={index} className="pdp-heading">{block.content}</Tag>;

          case 'paragraph':
            return <p key={index} className="pdp-paragraph">{block.content}</p>;

          case 'image':
            return (
              <div key={index} className="pdp-image-wrapper pdp-image-wrapper--single">
                <DistortedPixels2D 
                  src={block.src}
                  scrollContainer={scrollContainerRef as React.RefObject<HTMLElement>}
                  className="pdp-image"
                />
              </div>
            );

          case 'video':
            return (
              <div key={index} className="pdp-video-wrapper">
                <VideoPlayer
                  src={block.src}
                  poster={block.poster}
                  alt={block.alt}
                  autoplay={block.autoplay}
                  loop={block.loop}
                  muted={block.muted}
                  controls={block.controls}
                  className="pdp-video"
                />
              </div>
            );

          case 'list':
            return (
              <ul key={index} className="pdp-list">
                {block.items.map((listItem, idx) => (
                  <li key={idx}>
                    <span 
                      className="pdp-list-bullet" 
                      style={{ 
                        '--primary-color': item.primaryColor || 'currentColor' 
                      } as React.CSSProperties} 
                    />
                    <span className="pdp-list-content">{listItem}</span>
                  </li>
                ))}
              </ul>
            );

          default:
            return null;
        }
      }
      
      // 圖片群組
      const imageBlocks = groupItem as FeedContentBlock[];
      const gridClass = imageBlocks.length === 2 
        ? 'pdp-image-grid--two' 
        : 'pdp-image-grid--multi';
      
      return (
        <div key={index} className={`pdp-image-grid ${gridClass}`}>
          {imageBlocks.map((imgBlock, idx) => {
            if (imgBlock.type === 'image') {
              return (
                <div key={idx} className="pdp-image-wrapper pdp-image-wrapper--grid">
                  <DistortedPixels2D 
                    src={imgBlock.src}
                    scrollContainer={scrollContainerRef as React.RefObject<HTMLElement>}
                    className="pdp-image"
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    });
  };

  const contentBlocks = Array.isArray(item.content) 
    ? item.content as FeedContentBlock[]
    : item.content 
      ? [{ type: 'paragraph' as const, content: item.content }]
      : [];

  return (
    <div className={`project-detail-page ${className}`.trim()}>
      {/* Hero 區域 */}
      <section className="pdp-hero">
        <div className="pdp-hero__bg">
          <DistortedPixels2D 
            src={item.heroImage || ''}
            objectFit="cover"
            scrollContainer={scrollContainerRef as React.RefObject<HTMLElement>}
          />
        </div>
        <div className="pdp-hero__info">
          <div className="pdp-info__meta">
            <span className="pdp-meta__id">{item.brand || item.id}</span>
            <span className="pdp-meta__date">{item.date}</span>
          </div>
          <h1 className="pdp-info__heading">{item.heading}</h1>
          <div className="pdp-info__tags">
            {item.tags.map((tag, idx) => (
              <span key={idx} className="pdp-tag">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 內容區域 */}
      <div ref={scrollContainerRef} className="pdp-content">
        <article className="pdp-article">
          {/* {renderContentBlocks(contentBlocks)} */}
        </article>
      </div>
    </div>
  );
};

export default ProjectDetailPage;

