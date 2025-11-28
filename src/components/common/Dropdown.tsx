import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import './Dropdown.css';

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  searchable = true,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div 
      ref={dropdownRef} 
      className={cn('dropdown', disabled && 'dropdown--disabled')}
      onKeyDown={handleKeyDown}
    >
      <motion.button
        type="button"
        className={cn('dropdown__trigger', isOpen && 'dropdown__trigger--open')}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        whileTap={{ scale: 0.98 }}
      >
        <span className="dropdown__value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.span
          className="dropdown__arrow"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="dropdown__menu"
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {searchable && (
              <div className="dropdown__search">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="dropdown__search-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Search options"
                  role="searchbox"
                />
              </div>
            )}
            <div className="dropdown__options">
              {filteredOptions.length === 0 ? (
                <div className="dropdown__option dropdown__option--empty">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    className={cn(
                      'dropdown__option',
                      option.value === value && 'dropdown__option--selected'
                    )}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={option.value === value}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {option.label}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
