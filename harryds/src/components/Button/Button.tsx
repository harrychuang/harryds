// =============================================================================
// BUTTON 元件
// - 深色主題按鈕
// - 支援 primary / secondary / ghost 樣式
// =============================================================================

import React from 'react';
import './Button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按鈕樣式 */
  variant?: ButtonVariant;
  /** 按鈕大小 */
  size?: ButtonSize;
  /** 是否為全寬 */
  fullWidth?: boolean;
  /** 額外的 CSS 類名 */
  className?: string;
  /** 按鈕內容 */
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const classNames = [
    'hds-button',
    `hds-button--${variant}`,
    `hds-button--${size}`,
    fullWidth ? 'hds-button--full-width' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

