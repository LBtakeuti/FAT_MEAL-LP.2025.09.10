import React from 'react';
import type { AmbassadorItem } from '@/types/ambassador';

interface AmbassadorCardProps {
  item: AmbassadorItem;
}

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
          <div className="ambassador-content">
            <p className="ambassador-meta">
              <time className="ambassador-date">{item.date}</time>
            </p>
            <h4 className="ambassador-title">{item.title}</h4>
            <p className="ambassador-description">{item.description}</p>
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
        .ambassador-meta {
          display: block;
          font-size: 14px;
          font-weight: 500;
        }
        .ambassador-date {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          line-height: 14px;
          letter-spacing: 0.3px;
          display: inline;
        }
        .ambassador-title {
          font-size: 16px;
          font-weight: 700;
          line-height: 16px;
          letter-spacing: 0.3px;
          color: #333;
          margin-top: 8px;
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
          margin-top: 16px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .ambassador-card {
            width: 300px;
          }
          .ambassador-thumbnail {
            width: 300px;
            height: 168px;
          }
          .ambassador-thumbnail-img {
            width: 300px;
            height: 168px;
          }
          .ambassador-thumbnail-label {
            display: none;
          }
          .ambassador-container {
            grid-template-columns: 40px 244px;
          }
          .ambassador-author {
            width: 40px;
          }
          .ambassador-avatar {
            width: 40px;
            height: 40px;
          }
          .ambassador-author-caption {
            align-items: center;
          }
          .ambassador-content {
            width: 244px;
          }
          .ambassador-title {
            font-size: 14px;
            line-height: 14px;
          }
          .ambassador-description {
            font-size: 12px;
            line-height: 19.2px;
            margin-top: 8px;
          }
        }
      `}</style>
    </>
  );
}
