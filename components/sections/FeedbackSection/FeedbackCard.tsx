'use client';

import React from 'react';
import type { FeedbackItem } from '@/types/feedback';
import { CARD_WIDTH, CARD_IMAGE_ASPECT_RATIO } from '@/lib/constants/card';

interface FeedbackCardProps {
  item: FeedbackItem;
}

export function FeedbackCard({ item }: FeedbackCardProps) {
  return (
    <>
      <div className="feedback-card pb-2">
        {/* Thumbnail */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{ aspectRatio: CARD_IMAGE_ASPECT_RATIO }}
        >
          <img
            src={item.thumbnail_image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {item.thumbnail_label && (
            <span className="absolute top-2.5 left-2.5 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              {item.thumbnail_label}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 mt-4">
          {/* Meta: date */}
          <time className="text-sm text-gray-500">
            {item.date}
          </time>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-700 truncate">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-700 line-clamp-3">
            {item.description}
          </p>

          {/* SNSリンクボタン */}
          {(item.instagram_url || item.tiktok_url) && (
            <div className="flex gap-2 mt-1">
              {item.instagram_url && (
                <a
                  href={item.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feedback-sns-btn feedback-sns-instagram"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              )}
              {item.tiktok_url && (
                <a
                  href={item.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="feedback-sns-btn feedback-sns-tiktok"
                  aria-label="TikTok"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.21 8.21 0 004.84 1.56V6.82a4.85 4.85 0 01-1.07-.13z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .feedback-card {
            width: ${CARD_WIDTH}px;
          }
        }
        .feedback-sns-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .feedback-sns-btn:hover {
          opacity: 0.8;
        }
        .feedback-sns-btn svg {
          width: 14px;
          height: 14px;
        }
        .feedback-sns-instagram {
          background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
          color: #fff;
        }
        .feedback-sns-tiktok {
          background: #000;
          color: #fff;
        }
      `}</style>
    </>
  );
}
