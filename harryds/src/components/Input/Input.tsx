// =============================================================================
// INPUT 元件
// - 深色主題輸入框
// - 包含上方 label
// =============================================================================

import React, { forwardRef } from 'react';
import './Input.scss';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label 文字 */
  label?: string;
  /** 錯誤訊息 */
  error?: string;
  /** 額外的 CSS 類名 */
  className?: string;
  /** 是否為必填 */
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  className = '',
  required,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`hds-input ${error ? 'hds-input--error' : ''} ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="hds-input__label">
          {label}
          {required && <span className="hds-input__required">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className="hds-input__field"
        {...props}
      />
      {error && (
        <span className="hds-input__error">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

