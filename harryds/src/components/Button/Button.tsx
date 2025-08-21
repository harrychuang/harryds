import React from 'react';
import './Button.scss';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按鈕變體 */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** 按鈕大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 按鈕內容 */
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const classes = [
    'hds-button',
    `hds-button--${variant}`,
    `hds-button--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

Button.displayName = 'Button';