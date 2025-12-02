// =============================================================================
// DROPDOWN 元件
// - 深色主題下拉選單
// - 包含上方 label
// - 支援自訂選項
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Dropdown.scss';
import { PixelIcon } from '../PixelIcon';

export interface DropdownOption {
  /** 選項的值 */
  value: string;
  /** 選項的顯示文字 */
  label: string;
  /** 是否禁用此選項 */
  disabled?: boolean;
}

export interface DropdownProps {
  /** Label 文字 */
  label?: string;
  /** 選項列表 */
  options: DropdownOption[];
  /** 當前選中的值 */
  value?: string;
  /** Placeholder 文字 */
  placeholder?: string;
  /** 值改變時的回調 */
  onChange?: (value: string, option: DropdownOption) => void;
  /** 錯誤訊息 */
  error?: string;
  /** 是否為必填 */
  required?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 額外的 CSS 類名 */
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  placeholder = 'Select...',
  onChange,
  error,
  required,
  disabled,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 鍵盤操作
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(prev => !prev);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  }, [disabled, isOpen]);

  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;
    onChange?.(option.value, option);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`hds-dropdown ${isOpen ? 'hds-dropdown--open' : ''} ${error ? 'hds-dropdown--error' : ''} ${disabled ? 'hds-dropdown--disabled' : ''} ${className}`.trim()}
    >
      {label && (
        <label className="hds-dropdown__label">
          {label}
          {required && <span className="hds-dropdown__required">*</span>}
        </label>
      )}

      <div
        className="hds-dropdown__trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`hds-dropdown__value ${!selectedOption ? 'hds-dropdown__value--placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="hds-dropdown__arrow">
          <PixelIcon symbol="↧" pixelSize={2} />
        </span>
      </div>

      {isOpen && (
        <ul className="hds-dropdown__menu" role="listbox">
          {options.map((option) => (
            <li
              key={option.value}
              className={`hds-dropdown__option ${option.value === value ? 'hds-dropdown__option--selected' : ''} ${option.disabled ? 'hds-dropdown__option--disabled' : ''}`}
              onClick={() => handleSelect(option)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <span className="hds-dropdown__error">{error}</span>
      )}
    </div>
  );
};

export default Dropdown;

