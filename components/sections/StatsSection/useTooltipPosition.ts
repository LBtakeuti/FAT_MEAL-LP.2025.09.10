import { useState, useEffect, useRef } from 'react';
import type { TooltipPosition } from './types';

export function useTooltipPosition() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonRefDesktop = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = (btn: HTMLButtonElement) => {
    const buttonRect = btn.getBoundingClientRect();
    const container = btn.closest('.table-container') as HTMLElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setPosition({
        top: buttonRect.bottom - containerRect.top + 8,
        left: buttonRect.left - containerRect.left,
      });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, closeOther?: () => void) => {
    const btn = e.currentTarget;
    if (!isOpen) {
      calculatePosition(btn);
    }
    setIsOpen(!isOpen);
    closeOther?.();
  };

  // リサイズ時に位置を更新
  useEffect(() => {
    if (isOpen) {
      const updatePosition = () => {
        const btn = buttonRef.current || buttonRefDesktop.current;
        if (btn) {
          calculatePosition(btn);
        }
      };
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // 外部クリックで閉じる
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const isInsideTooltip = tooltipRef.current?.contains(target);
        const isInsideButton =
          buttonRef.current?.contains(target) || buttonRefDesktop.current?.contains(target);
        if (!isInsideTooltip && !isInsideButton) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return {
    isOpen,
    position,
    buttonRef,
    buttonRefDesktop,
    tooltipRef,
    handleClick,
    setIsOpen,
  };
}
