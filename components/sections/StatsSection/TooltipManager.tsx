import React from 'react';
import type { TooltipPosition, TooltipData } from './types';

interface TooltipManagerProps {
  isOpen: boolean;
  position: TooltipPosition;
  data: TooltipData;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
}

export function TooltipManager({ isOpen, position, data, tooltipRef, isMobile }: TooltipManagerProps) {
  if (!isOpen) return null;

  return (
    <div
      ref={tooltipRef}
      className="absolute w-[calc(100%-2rem)] sm:w-96 p-4 bg-gray-900 text-white rounded-lg z-[100] left-4 sm:left-auto"
      style={{
        top: position.top > 0 ? `${position.top}px` : '100px',
        ...(!isMobile && position.left > 0 ? { left: `${position.left}px` } : {}),
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
      <p className="font-bold mb-3 text-white">{data.title}</p>
      <ul className="space-y-2 text-sm text-gray-200">
        {data.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-gray-300">{data.note}</p>
    </div>
  );
}
