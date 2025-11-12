// =============================================================================
// LIST CARD 元件 - 推薦人卡片
// 左側顯示頭像，右側顯示職稱、姓名和推薦文字
// =============================================================================

import React, { CSSProperties } from 'react';
import './ListCard.scss';

export interface ListCardProps {
  /** 頭像圖片來源 */
  imageSrc: string;
  /** 職稱 */
  title: string;
  /** 姓名 */
  name: string;
  /** 推薦文字 */
  testimonial: string;
  /** 額外類名 */
  className?: string;
  /** 內聯樣式 */
  style?: CSSProperties;
}

export const ListCard: React.FC<ListCardProps> = ({
  imageSrc,
  title,
  name,
  testimonial,
  className = '',
  style,
}) => {
  return (
    <div className={`list-card ${className}`.trim()} style={style}>
      <div className="list-card__image">
        <img src={imageSrc} alt={name} />
      </div>
      <div className="list-card__content">
        <div className="list-card__title">{title}</div>
        <div className="list-card__name">{name}</div>
        <div className="list-card__testimonial">{testimonial}</div>
      </div>
    </div>
  );
};

export default ListCard;

