// =============================================================================
// PLAYGROUND 頁面
// =============================================================================

import React, { useMemo } from 'react';
import './Playground.scss';
import { FeedDetailOverlay } from '@components/FeedDetailOverlay';
import type { FeedCardSize } from '@components/FeedCard/FeedCard';
import type { FeedItem } from '../../types/feed';
import feed from '../../../../shared/data/feed.json';

export const Playground: React.FC = () => {
  const items = useMemo(() => (feed as any).items as FeedItem[], []);

  const getSizeByIndex = (index: number): FeedCardSize => {
    if (index === 0) return 'hero';
    if (index <= 2) return 'med'; // 1,2
    if (index <= 5) return 'sm';  // 3,4,5
    return 'xs';                  // 6,7,8
  };

  const resolveSrc = (fileName?: string) => {
    if (!fileName) return '';
    return new URL(`../../../assets/imgs/${fileName}`, import.meta.url).href;
  };

  return (
    <div className="playground">
      <div className="playground__container">
        <h1>Playground</h1>
        <p>在這裡測試和組裝元件</p>

        <div className="playground__content">
          {items.slice(0, 9).map((item, index) => {
            const size = getSizeByIndex(index);
            const src = resolveSrc(item.heroImage);
            return (
              <div key={item.id} className={`pg-card pg-card--${size}`.trim()}>
                <FeedDetailOverlay
                  open={false}
                  src={src}
                  sizeWhenClosed={size}
                  padding={40}
                  backgroundProps={{ 
                    pixelSize: size === 'hero' ? 80 : size === 'med' ? 70 : size === 'sm' ? 60 : 50,
                    hoverPixelToOne: true,
                    hoverPixelDuration: 500,
                    desaturateUntilHover: true,
                    objectFit: 'cover'
                  }}
                  secondaryColor={item.secondaryColor}
                  infoMaxWidth={1400}
                  infoData={{ id: item.id, heading: item.heading, date: item.date, tags: item.tags, category: item.category }}
                  primaryColor={item.primaryColor}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Playground;
