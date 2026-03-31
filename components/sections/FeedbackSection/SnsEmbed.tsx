'use client';

import React, { useEffect, useRef } from 'react';

interface SnsEmbedProps {
  snsType: string;
  snsUrl: string;
}

export function SnsEmbed({ snsType, snsUrl }: SnsEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (snsType === 'instagram') {
      // Instagram embed script
      if ((window as any).instgrm) {
        (window as any).instgrm.Embeds.process();
      } else {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }

    if (snsType === 'twitter' || snsType === 'x') {
      if ((window as any).twttr) {
        (window as any).twttr.widgets.load(containerRef.current);
      } else {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }

    if (snsType === 'tiktok') {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [snsType, snsUrl]);

  if (snsType === 'instagram') {
    // URLからshortcodeを抽出してblockquoteを生成
    const match = snsUrl.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (!match) return null;
    const shortcode = match[1];
    return (
      <div ref={containerRef} className="flex justify-center">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={`https://www.instagram.com/p/${shortcode}/`}
          data-instgrm-version="14"
          style={{ maxWidth: '540px', width: '100%', minWidth: '326px' }}
        />
      </div>
    );
  }

  if (snsType === 'twitter' || snsType === 'x') {
    // URLからtweetidを抽出
    const match = snsUrl.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/);
    if (!match) return null;
    const tweetId = match[1];
    return (
      <div ref={containerRef} className="flex justify-center">
        <blockquote className="twitter-tweet" data-dnt="true">
          <a href={`https://twitter.com/i/web/status/${tweetId}`} />
        </blockquote>
      </div>
    );
  }

  if (snsType === 'tiktok') {
    const match = snsUrl.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (!match) return null;
    const videoId = match[1];
    return (
      <div ref={containerRef} className="flex justify-center">
        <blockquote
          className="tiktok-embed"
          cite={snsUrl}
          data-video-id={videoId}
          style={{ maxWidth: '605px', minWidth: '325px' }}
        >
          <section />
        </blockquote>
      </div>
    );
  }

  if (snsType === 'youtube') {
    // YouTube URLからvideo IDを抽出
    const match = snsUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (!match) return null;
    const videoId = match[1];
    return (
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          className="absolute inset-0 w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    );
  }

  return null;
}
