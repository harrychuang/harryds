// =============================================================================
// POPUP MODAL 元件
// - 深色主題彈出視窗
// - 包含 heading, description, button
// - 支援放置自訂內容（input, dropdown 等）
// =============================================================================

import React, { useEffect, useCallback } from 'react';
import './PopupModal.scss';
import { PixelIcon } from '../PixelIcon';

export interface PopupModalProps {
  /** 是否顯示 Modal */
  isOpen: boolean;
  /** 關閉 Modal 的回調 */
  onClose: () => void;
  /** 標題 */
  heading?: string;
  /** 描述文字 */
  description?: string;
  /** 主要按鈕文字 */
  primaryButtonText?: string;
  /** 主要按鈕點擊事件 */
  onPrimaryClick?: () => void;
  /** 次要按鈕文字（可選） */
  secondaryButtonText?: string;
  /** 次要按鈕點擊事件 */
  onSecondaryClick?: () => void;
  /** 自訂內容（放置 Input, Dropdown 等） */
  children?: React.ReactNode;
  /** 點擊背景是否關閉 */
  closeOnOverlayClick?: boolean;
  /** 按 ESC 是否關閉 */
  closeOnEsc?: boolean;
  /** 是否顯示關閉按鈕 */
  showCloseButton?: boolean;
  /** 額外的 CSS 類名 */
  className?: string;
}

export const PopupModal: React.FC<PopupModalProps> = ({
  isOpen,
  onClose,
  heading,
  description,
  primaryButtonText,
  onPrimaryClick,
  secondaryButtonText,
  onSecondaryClick,
  children,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
}) => {
  // ESC 鍵關閉
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (closeOnEsc && event.key === 'Escape') {
      onClose();
    }
  }, [closeOnEsc, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // 點擊背景關閉
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`hds-modal__overlay ${className}`.trim()}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={heading ? 'modal-heading' : undefined}
    >
      <div className="hds-modal">
        {/* 關閉按鈕 */}
        {showCloseButton && (
          <button
            className="hds-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <PixelIcon symbol="×" pixelSize={2.5} />
          </button>
        )}

        {/* Header */}
        {(heading || description) && (
          <div className="hds-modal__header">
            {heading && (
              <h2 id="modal-heading" className="hds-modal__heading">
                {heading}
              </h2>
            )}
            {description && (
              <p className="hds-modal__description">
                {description}
              </p>
            )}
          </div>
        )}

        {/* 自訂內容 */}
        {children && (
          <div className="hds-modal__content">
            {children}
          </div>
        )}

        {/* Footer / Buttons */}
        {(primaryButtonText || secondaryButtonText) && (
          <div className="hds-modal__footer">
            {secondaryButtonText && (
              <button
                className="hds-modal__button hds-modal__button--secondary"
                onClick={onSecondaryClick || onClose}
              >
                {secondaryButtonText}
              </button>
            )}
            {primaryButtonText && (
              <button
                className="hds-modal__button hds-modal__button--primary"
                onClick={onPrimaryClick}
              >
                {primaryButtonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupModal;

