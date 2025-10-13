import { useState, useRef, useEffect, type ReactNode } from 'react';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, onSelect, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    onSelect(item.value);
    setIsOpen(false);
  };

  return (
    <div className={`dropdown ${className}`} ref={dropdownRef}>
      <div 
        className="dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={`dropdown-menu ${align === 'right' ? 'dropdown-menu-right' : ''}`}
          role="menu"
        >
          {items.map((item, index) => (
            item.divider ? (
              <div key={`divider-${index}`} className="dropdown-divider" role="separator" />
            ) : (
              <button
                key={item.value}
                className={`dropdown-item ${item.disabled ? 'dropdown-item-disabled' : ''} ${item.danger ? 'dropdown-item-danger' : ''}`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

// Simple icon button dropdown
export interface DropdownMenuProps {
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
}

export function DropdownMenu({ items, onSelect, align = 'right' }: DropdownMenuProps) {
  return (
    <Dropdown
      trigger={
        <button className="btn-icon" aria-label="More actions">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      }
      items={items}
      onSelect={onSelect}
      align={align}
    />
  );
}
