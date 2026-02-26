'use client';

import React from 'react';
import type { AmbassadorItem } from '@/types/ambassador';
import { CARD_WIDTH, CARD_IMAGE_ASPECT_RATIO } from '@/lib/constants/card';

interface AmbassadorCardProps {
  item: AmbassadorItem;
}

// モバイル版のカードサイズ定数
const MOBILE_CARD_WIDTH = CARD_WIDTH;
const MOBILE_CARD_HEIGHT = Math.round(MOBILE_CARD_WIDTH / CARD_IMAGE_ASPECT_RATIO);
const MOBILE_AVATAR_SIZE = 40;
const MOBILE_CONTENT_WIDTH = MOBILE_CARD_WIDTH - MOBILE_AVATAR_SIZE - 16; // 16px = grid gap

export function AmbassadorCard({ item }: AmbassadorCardProps) {
  return (
    <>
      <div className="ambassador-card">
        {/* Thumbnail */}
        <figure className="ambassador-thumbnail">
          <img
            className="ambassador-thumbnail-img"
            src={item.thumbnail_image}
            alt={item.title}
            loading="lazy"
            draggable="false"
          />
          {item.thumbnail_label && (
            <figcaption className="ambassador-thumbnail-label">
              {item.thumbnail_label}
            </figcaption>
          )}
        </figure>

        {/* Container: Grid layout */}
        <div className="ambassador-container">
          {/* Author Column */}
          <div className="ambassador-author">
            <figure>
              <img
                className="ambassador-avatar"
                src={item.icon_image}
                alt={item.department || ''}
                loading="lazy"
                draggable="false"
              />
              {item.department && (
                <figcaption className="ambassador-author-caption">
                  <span className="ambassador-department">{item.department}</span>
                </figcaption>
              )}
            </figure>
          </div>

          {/* Content Column */}
          <div className="ambassador-content flex flex-col gap-2">
            <time className="ambassador-date">{item.date}</time>
            <h4 className="ambassador-title">{item.title}</h4>
            <p className="ambassador-description">{item.description}</p>
            {(item.instagram_url || item.tiktok_url) && (
              <div className="ambassador-sns">
                {item.instagram_url && (
                  <a
                    href={item.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ambassador-sns-btn ambassador-sns-instagram"
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
                    className="ambassador-sns-btn ambassador-sns-tiktok"
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
      </div>

      {/* Card Styles */}
      <style jsx>{`
        /* Card wrapper - 500px fixed */
        .ambassador-card {
          width: 500px;
        }

        /* Thumbnail */
        .ambassador-thumbnail {
          width: 500px;
          height: 280px;
          overflow: hidden;
          border-radius: 8px;
          line-height: 0;
          position: relative;
        }
        .ambassador-thumbnail-img {
          width: 500px;
          height: 280px;
          aspect-ratio: 25 / 14;
          object-fit: cover;
          display: block;
        }
        .ambassador-thumbnail-label {
          position: absolute;
          left: 10px;
          bottom: 10px;
          background: linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 100%);
          padding: 28px 14px 10px;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          line-height: 1;
        }

        /* Container grid: 50px + 434px = 500px (with 16px gap) */
        .ambassador-container {
          display: grid;
          grid-template-columns: 50px 434px;
          gap: 16px;
          margin: 16px 0 0;
        }

        /* Author column */
        .ambassador-author {
          width: 50px;
        }
        .ambassador-author figure {
          display: block;
        }
        .ambassador-avatar {
          width: 50px;
          height: 50px;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          object-fit: contain;
          display: block;
        }
        .ambassador-author-caption {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 8px;
          line-height: 10px;
        }
        .ambassador-department {
          font-size: 10px;
          font-weight: 500;
          color: #818181;
          letter-spacing: 0.3px;
          line-height: 10px;
          text-align: center;
        }

        /* Content column */
        .ambassador-content {
          width: 434px;
        }
        .ambassador-date {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 14px;
          letter-spacing: 0.3px;
        }
        .ambassador-title {
          font-size: 16px;
          font-weight: 700;
          line-height: 16px;
          letter-spacing: 0.3px;
          color: #333;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
        .ambassador-description {
          font-size: 14px;
          font-weight: 500;
          line-height: 22.4px;
          letter-spacing: 0.3px;
          color: #333;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        /* SNS buttons */
        .ambassador-sns {
          display: flex;
          gap: 8px;
          margin-top: 2px;
        }
        .ambassador-sns-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }
        .ambassador-sns-btn:hover {
          opacity: 0.8;
        }
        .ambassador-sns-btn svg {
          width: 14px;
          height: 14px;
        }
        .ambassador-sns-instagram {
          background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%);
          color: #fff;
        }
        .ambassador-sns-tiktok {
          background: #000;
          color: #fff;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .ambassador-card {
            width: ${MOBILE_CARD_WIDTH}px;
          }
          .ambassador-thumbnail {
            width: ${MOBILE_CARD_WIDTH}px;
            height: ${MOBILE_CARD_HEIGHT}px;
          }
          .ambassador-thumbnail-img {
            width: ${MOBILE_CARD_WIDTH}px;
            height: ${MOBILE_CARD_HEIGHT}px;
          }
          .ambassador-thumbnail-label {
            display: none;
          }
          .ambassador-container {
            grid-template-columns: ${MOBILE_AVATAR_SIZE}px ${MOBILE_CONTENT_WIDTH}px;
          }
          .ambassador-author {
            width: ${MOBILE_AVATAR_SIZE}px;
          }
          .ambassador-avatar {
            width: ${MOBILE_AVATAR_SIZE}px;
            height: ${MOBILE_AVATAR_SIZE}px;
          }
          .ambassador-author-caption {
            align-items: center;
          }
          .ambassador-content {
            width: ${MOBILE_CONTENT_WIDTH}px;
          }
          .ambassador-title {
            font-size: 14px;
            line-height: 14px;
          }
          .ambassador-description {
            font-size: 12px;
            line-height: 19.2px;
          }
        }
      `}</style>
    </>
  );
}
